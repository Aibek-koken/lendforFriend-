-- Stage 2: secure web -> desktop (Tauri) auth handoff.
-- Run after supabase/signup.sql.
--
-- Design rules enforced here, not just in application code:
--   * Only HASHES of the one-time code and the desktop state nonce are stored.
--     A database leak must not yield a usable code.
--   * Codes are short-lived (TTL) and strictly single-use. Consumption is a
--     single atomic UPDATE with `consumed_at is null` in the WHERE clause, so
--     two concurrent exchanges can never both win.
--   * No Supabase access_token / refresh_token ever leaves the browser session.
--     The desktop receives an opaque desktop-session token instead.
--   * Consumption runs as service_role only (server route handler). The
--     authenticated user can issue a code for THEMSELVES and nothing else.

create extension if not exists pgcrypto;

-- One-time authorization codes handed to the desktop app through the
-- liveassist:// deep link. `code_hash` / `state_hash` are sha256 hex digests.
create table if not exists public.desktop_auth_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique check (code_hash ~ '^[0-9a-f]{64}$'),
  state_hash text not null check (state_hash ~ '^[0-9a-f]{64}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists desktop_auth_codes_user_id_idx on public.desktop_auth_codes(user_id);
create index if not exists desktop_auth_codes_expires_at_idx on public.desktop_auth_codes(expires_at);

-- The minimal desktop session issued after a successful code exchange. The
-- desktop stores the plaintext token in the OS keychain; we keep only the hash,
-- so revocation is possible server-side and a database leak yields no token.
create table if not exists public.desktop_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);
create index if not exists desktop_sessions_user_id_idx on public.desktop_sessions(user_id);

alter table public.desktop_auth_codes enable row level security;
alter table public.desktop_sessions enable row level security;

-- No policies on purpose: neither anon nor authenticated may read or write
-- these tables directly. All access goes through the SECURITY DEFINER
-- functions below. service_role bypasses RLS and is server-only.

-- Issued by the signed-in browser session at the end of signup. The caller
-- supplies only hashes; the plaintext code/state never reach the database.
-- Any still-unconsumed code for this user is invalidated first, so a user
-- cannot accumulate live codes by refreshing the final screen.
create or replace function public.issue_desktop_auth_code(
  requested_code_hash text,
  requested_state_hash text,
  ttl_seconds integer
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid := auth.uid();
  resolved_company_id uuid;
  code_expires_at timestamptz;
begin
  if current_user_id is null then raise exception 'authentication required'; end if;
  if requested_code_hash !~ '^[0-9a-f]{64}$' then raise exception 'invalid code hash'; end if;
  if requested_state_hash !~ '^[0-9a-f]{64}$' then raise exception 'invalid state hash'; end if;
  if ttl_seconds is null or ttl_seconds < 30 or ttl_seconds > 900 then
    raise exception 'invalid ttl';
  end if;

  -- A code is only meaningful once the user actually has a workspace.
  select cm.company_id into resolved_company_id
  from public.company_members cm
  where cm.user_id = current_user_id
  order by cm.created_at asc
  limit 1;

  if resolved_company_id is null then raise exception 'workspace required'; end if;

  update public.desktop_auth_codes
  set consumed_at = now()
  where user_id = current_user_id and consumed_at is null;

  code_expires_at := now() + make_interval(secs => ttl_seconds);

  insert into public.desktop_auth_codes (code_hash, state_hash, user_id, company_id, expires_at)
  values (requested_code_hash, requested_state_hash, current_user_id, resolved_company_id, code_expires_at);

  return jsonb_build_object('expiresAt', code_expires_at);
end;
$$;

-- Consumed by the server-side exchange route (service_role only). Atomic:
-- the single UPDATE both claims the code and tells us whether we won.
-- Returns a discriminated result; it never raises on a bad/expired/replayed
-- code, so the caller can answer with one generic client-facing error.
create or replace function public.consume_desktop_auth_code(
  requested_code_hash text,
  requested_state_hash text,
  session_token_hash text,
  session_ttl_seconds integer
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  claimed public.desktop_auth_codes%rowtype;
  session_expires_at timestamptz;
  workspace jsonb;
  profile_language text;
begin
  if session_token_hash !~ '^[0-9a-f]{64}$' then raise exception 'invalid session token hash'; end if;
  if session_ttl_seconds is null or session_ttl_seconds < 3600 then raise exception 'invalid session ttl'; end if;

  -- Single-use + TTL + state binding, all in one atomic claim. A replayed code
  -- fails the `consumed_at is null` predicate; an expired one fails
  -- `expires_at > now()`; a mismatched state fails the state_hash predicate.
  update public.desktop_auth_codes
  set consumed_at = now()
  where code_hash = requested_code_hash
    and state_hash = requested_state_hash
    and consumed_at is null
    and expires_at > now()
  returning * into claimed;

  if claimed.id is null then
    return jsonb_build_object('ok', false, 'reason', 'invalid_code');
  end if;

  session_expires_at := now() + make_interval(secs => session_ttl_seconds);

  insert into public.desktop_sessions (token_hash, user_id, company_id, expires_at)
  values (session_token_hash, claimed.user_id, claimed.company_id, session_expires_at);

  select jsonb_build_object(
    'companyId', c.id,
    'companyName', c.name,
    'mode', c.mode::text,
    'crmProvider', cc.provider::text,
    'crmStatus', cc.status::text
  ) into workspace
  from public.companies c
  left join public.crm_connections cc on cc.company_id = c.id
  where c.id = claimed.company_id;

  select p.preferred_language into profile_language
  from public.profiles p where p.id = claimed.user_id;

  return jsonb_build_object(
    'ok', true,
    'userId', claimed.user_id,
    'language', coalesce(profile_language, 'en'),
    'workspace', coalesce(workspace, '{}'::jsonb),
    'session', jsonb_build_object('expiresAt', session_expires_at)
  );
end;
$$;

-- Housekeeping. Safe to call from a scheduled job; consumed/expired codes carry
-- no secret (hashes only), but there is no reason to keep them.
create or replace function public.purge_expired_desktop_auth_codes()
returns integer language plpgsql security definer set search_path = '' as $$
declare removed integer;
begin
  delete from public.desktop_auth_codes
  where expires_at < now() - interval '1 day';
  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke all on function public.issue_desktop_auth_code(text, text, integer) from public, anon;
revoke all on function public.consume_desktop_auth_code(text, text, text, integer) from public, anon, authenticated;
revoke all on function public.purge_expired_desktop_auth_codes() from public, anon, authenticated;

grant execute on function public.issue_desktop_auth_code(text, text, integer) to authenticated;
grant execute on function public.consume_desktop_auth_code(text, text, text, integer) to service_role;
grant execute on function public.purge_expired_desktop_auth_codes() to service_role;
