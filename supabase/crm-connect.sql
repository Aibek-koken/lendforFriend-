-- Web-first CRM connect. Run after supabase/signup.sql.
--
-- Splits the CRM connection into two tables with deliberately different trust
-- levels:
--
--   public.crm_connections          non-secret METADATA. Readable by the
--                                   company's members (RLS), safe to render in
--                                   the web account page and the desktop
--                                   Settings snapshot.
--
--   public.crm_connection_secrets   client_secret + OAuth tokens. RLS is ON and
--                                   NO policy is ever created, so `anon` and
--                                   `authenticated` can read exactly nothing.
--                                   Only the service-role key (which bypasses
--                                   RLS) can touch it, and only from server-side
--                                   Next.js route handlers / server actions.
--                                   Values are additionally encrypted at rest
--                                   with CRM_SECRETS_ENCRYPTION_KEY (AES-256-GCM,
--                                   lib/crm/crypto.ts), so a leaked database
--                                   dump alone does not yield usable credentials.
--
-- Nothing in here is reachable from a browser, a renderer, or a URL.

-- --------------------------------------------------------------------------
-- 1. Non-secret metadata on the existing connection row.
-- --------------------------------------------------------------------------

alter table public.crm_connections
  add column if not exists subdomain text
    check (subdomain is null or subdomain ~ '^[a-z0-9][a-z0-9-]{0,62}$'),
  add column if not exists domain_zone text
    check (domain_zone is null or domain_zone in ('amocrm.ru', 'amocrm.com', 'kommo.com')),
  -- The integration's public client id. Not a secret (it travels in the
  -- authorize URL the user's own browser opens), so it lives with the metadata.
  add column if not exists client_id text,
  -- amoCRM's own account identifier / referer, once OAuth has told us.
  add column if not exists external_account_id text,
  add column if not exists connected_at timestamptz,
  -- Last failure, as a machine-readable code (never a raw provider message,
  -- which could echo back credentials or tokens).
  add column if not exists last_error_code text,
  add column if not exists last_error_at timestamptz;

-- --------------------------------------------------------------------------
-- 2. The secrets table. Service-role only, encrypted at rest.
-- --------------------------------------------------------------------------

create table if not exists public.crm_connection_secrets (
  company_id uuid primary key references public.companies(id) on delete cascade,
  provider public.crm_provider not null,
  -- Every *_enc column holds the output of lib/crm/crypto.ts `encryptSecret`
  -- ("v1.<iv>.<tag>.<ciphertext>", all base64url). Never a plaintext secret.
  client_secret_enc text not null,
  access_token_enc text,
  refresh_token_enc text,
  -- When the stored access token stops working. Refresh is driven off this.
  access_token_expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists crm_secrets_touch_updated_at on public.crm_connection_secrets;
create trigger crm_secrets_touch_updated_at before update on public.crm_connection_secrets
for each row execute function public.touch_updated_at();

-- RLS on, and NOT ONE POLICY. This is the whole point: with RLS enabled and no
-- policy, PostgREST returns zero rows to `anon` and `authenticated` for every
-- select, and rejects every write. The service-role key bypasses RLS, so the
-- only reader is our own server code.
alter table public.crm_connection_secrets enable row level security;

-- Belt and braces: even the grant is withheld, so a future accidental
-- `create policy ... using (true)` still would not expose the table.
revoke all on public.crm_connection_secrets from anon, authenticated;

-- --------------------------------------------------------------------------
-- 3. Account state RPC — what the web /account page renders.
--
-- Deliberately reads ONLY public.crm_connections. It cannot leak a secret
-- because it never touches the secrets table.
-- --------------------------------------------------------------------------

create or replace function public.get_account_state()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'authentication required'; end if;

  return (
    select jsonb_build_object(
      'authenticated', true,
      'userId', current_user_id,
      'displayName', p.display_name,
      'language', p.preferred_language,
      'companyId', c.id,
      'companyName', c.name,
      'mode', c.mode::text,
      'crmProvider', cc.provider::text,
      'crmStatus', cc.status::text,
      'crmSubdomain', cc.subdomain,
      'crmDomainZone', cc.domain_zone,
      'crmClientId', cc.client_id,
      'crmAccountId', cc.external_account_id,
      'crmConnectedAt', cc.connected_at,
      'crmLastErrorCode', cc.last_error_code,
      'crmLastErrorAt', cc.last_error_at
    )
    from public.profiles p
    left join lateral (
      select co.* from public.company_members cm
      join public.companies co on co.id = cm.company_id
      where cm.user_id = current_user_id order by cm.created_at asc limit 1
    ) c on true
    left join public.crm_connections cc on cc.company_id = c.id
    where p.id = current_user_id
  );
end;
$$;

revoke all on function public.get_account_state() from public, anon;
grant execute on function public.get_account_state() to authenticated;
