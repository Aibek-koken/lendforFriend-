-- LiveAssist signup MVP. Run after supabase/waitlist.sql.
-- All signup writes happen through the authenticated RPC functions below.

create extension if not exists pgcrypto;

do $$ begin
  create type public.company_mode as enum ('real', 'demo');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.company_role as enum ('owner', 'member');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.crm_provider as enum ('amocrm', 'bitrix24', 'hubspot', 'other', 'none');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.crm_status as enum ('pending', 'connected', 'failed', 'unsupported', 'demo');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.signup_mode as enum ('real', 'demo');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  preferred_language text not null default 'en' check (preferred_language in ('en', 'ru')),
  signup_mode public.signup_mode,
  onboarding_step text not null default 'mode' check (onboarding_step in ('mode', 'company', 'complete')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) between 2 and 120),
  manager_count_bucket text check (manager_count_bucket in ('1', '2-5', '6-20', '20+')),
  main_goal text check (main_goal in ('sales', 'support', 'training', 'other')),
  mode public.company_mode not null,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists one_demo_company_per_creator
  on public.companies(created_by) where mode = 'demo';

create table if not exists public.company_members (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.company_role not null,
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);
create index if not exists company_members_user_id_idx on public.company_members(user_id);

create table if not exists public.crm_connections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  provider public.crm_provider not null,
  status public.crm_status not null,
  external_account_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id)
);

-- Demo-only records are structurally separated from future real CRM sync tables.
create table if not exists public.demo_deal_stages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  position smallint not null,
  is_demo boolean not null default true check (is_demo),
  unique (company_id, position)
);
create table if not exists public.demo_accounts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  is_demo boolean not null default true check (is_demo)
);
create table if not exists public.demo_leads (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  account_id uuid references public.demo_accounts(id) on delete cascade,
  stage_id uuid not null references public.demo_deal_stages(id) on delete restrict,
  contact_name text not null,
  title text not null,
  value_amount numeric(12, 2),
  is_demo boolean not null default true check (is_demo)
);
create table if not exists public.demo_call_notes (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  lead_id uuid not null references public.demo_leads(id) on delete cascade,
  note text not null,
  happened_at timestamptz not null,
  is_demo boolean not null default true check (is_demo)
);

create index if not exists crm_connections_company_id_idx on public.crm_connections(company_id);
create index if not exists demo_stages_company_id_idx on public.demo_deal_stages(company_id);
create index if not exists demo_accounts_company_id_idx on public.demo_accounts(company_id);
create index if not exists demo_leads_company_id_idx on public.demo_leads(company_id);
create index if not exists demo_notes_company_id_idx on public.demo_call_notes(company_id);

create or replace function public.touch_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at before update on public.profiles
for each row execute function public.touch_updated_at();
drop trigger if exists companies_touch_updated_at on public.companies;
create trigger companies_touch_updated_at before update on public.companies
for each row execute function public.touch_updated_at();
drop trigger if exists crm_touch_updated_at on public.crm_connections;
create trigger crm_touch_updated_at before update on public.crm_connections
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'avatar_url'
  ) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_members enable row level security;
alter table public.crm_connections enable row level security;
alter table public.demo_deal_stages enable row level security;
alter table public.demo_accounts enable row level security;
alter table public.demo_leads enable row level security;
alter table public.demo_call_notes enable row level security;

drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles for select using (id = (select auth.uid()));
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles for update using (id = (select auth.uid())) with check (id = (select auth.uid()));

drop policy if exists companies_select_member on public.companies;
create policy companies_select_member on public.companies for select using (
  exists (select 1 from public.company_members cm where cm.company_id = companies.id and cm.user_id = (select auth.uid()))
);
drop policy if exists memberships_select_self on public.company_members;
create policy memberships_select_self on public.company_members for select using (user_id = (select auth.uid()));
drop policy if exists crm_select_member on public.crm_connections;
create policy crm_select_member on public.crm_connections for select using (
  exists (select 1 from public.company_members cm where cm.company_id = crm_connections.company_id and cm.user_id = (select auth.uid()))
);

drop policy if exists demo_stages_select_member on public.demo_deal_stages;
create policy demo_stages_select_member on public.demo_deal_stages for select using (
  exists (select 1 from public.company_members cm join public.companies c on c.id = cm.company_id where cm.company_id = demo_deal_stages.company_id and cm.user_id = (select auth.uid()) and c.mode = 'demo')
);
drop policy if exists demo_accounts_select_member on public.demo_accounts;
create policy demo_accounts_select_member on public.demo_accounts for select using (
  exists (select 1 from public.company_members cm join public.companies c on c.id = cm.company_id where cm.company_id = demo_accounts.company_id and cm.user_id = (select auth.uid()) and c.mode = 'demo')
);
drop policy if exists demo_leads_select_member on public.demo_leads;
create policy demo_leads_select_member on public.demo_leads for select using (
  exists (select 1 from public.company_members cm join public.companies c on c.id = cm.company_id where cm.company_id = demo_leads.company_id and cm.user_id = (select auth.uid()) and c.mode = 'demo')
);
drop policy if exists demo_notes_select_member on public.demo_call_notes;
create policy demo_notes_select_member on public.demo_call_notes for select using (
  exists (select 1 from public.company_members cm join public.companies c on c.id = cm.company_id where cm.company_id = demo_call_notes.company_id and cm.user_id = (select auth.uid()) and c.mode = 'demo')
);

create or replace function public.signup_state_for(requested_user uuid)
returns jsonb language sql stable security definer set search_path = '' as $$
  select case when c.id is not null then jsonb_build_object(
    'authenticated', true, 'step', 'complete', 'mode', c.mode::text,
    'companyId', c.id, 'companyName', c.name,
    'crmProvider', cc.provider::text, 'crmStatus', cc.status::text
  ) else jsonb_build_object(
    'authenticated', true,
    'step', case when p.signup_mode = 'real' then 'company' else 'mode' end,
    'mode', p.signup_mode::text, 'companyId', null, 'companyName', null,
    'crmProvider', null, 'crmStatus', null
  ) end
  from public.profiles p
  left join lateral (
    select co.* from public.company_members cm
    join public.companies co on co.id = cm.company_id
    where cm.user_id = requested_user order by cm.created_at asc limit 1
  ) c on true
  left join public.crm_connections cc on cc.company_id = c.id
  where p.id = requested_user;
$$;
revoke all on function public.signup_state_for(uuid) from public, anon, authenticated;

create or replace function public.get_signup_state()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'authentication required'; end if;
  insert into public.profiles (id) values (current_user_id) on conflict (id) do nothing;
  return public.signup_state_for(current_user_id);
end;
$$;

create or replace function public.save_signup_progress(requested_mode public.signup_mode, requested_language text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare current_user_id uuid := auth.uid();
begin
  if current_user_id is null then raise exception 'authentication required'; end if;
  if requested_language not in ('en', 'ru') then raise exception 'invalid language'; end if;
  if exists (select 1 from public.company_members where user_id = current_user_id) then
    return public.signup_state_for(current_user_id);
  end if;
  insert into public.profiles (id, preferred_language, signup_mode, onboarding_step)
  values (current_user_id, requested_language, requested_mode, case when requested_mode = 'real' then 'company' else 'mode' end)
  on conflict (id) do update set preferred_language = excluded.preferred_language,
    signup_mode = excluded.signup_mode, onboarding_step = excluded.onboarding_step;
  return public.signup_state_for(current_user_id);
end;
$$;

create or replace function public.complete_real_signup(
  company_name text, manager_bucket text, crm_provider public.crm_provider,
  primary_goal text, requested_language text
) returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid := auth.uid();
  new_company_id uuid;
  existing_company_id uuid;
  existing_company_mode public.company_mode;
  existing_member_role public.company_role;
  connection_status public.crm_status;
begin
  if current_user_id is null then raise exception 'authentication required'; end if;
  if char_length(trim(company_name)) not between 2 and 120 then raise exception 'invalid company name'; end if;
  if manager_bucket not in ('1', '2-5', '6-20', '20+') then raise exception 'invalid manager count'; end if;
  if primary_goal not in ('sales', 'support', 'training', 'other') then raise exception 'invalid goal'; end if;
  if requested_language not in ('en', 'ru') then raise exception 'invalid language'; end if;

  insert into public.profiles (id) values (current_user_id) on conflict (id) do nothing;
  perform 1 from public.profiles where id = current_user_id for update;
  select c.id, c.mode, cm.role
    into existing_company_id, existing_company_mode, existing_member_role
  from public.company_members cm
  join public.companies c on c.id = cm.company_id
  where cm.user_id = current_user_id
  order by cm.created_at asc
  limit 1
  for update of c;

  connection_status := case when crm_provider = 'amocrm' then 'pending'::public.crm_status else 'unsupported'::public.crm_status end;

  if existing_company_id is not null and existing_company_mode = 'demo' and existing_member_role = 'owner' then
    -- Upgrade the current demo workspace in place. This preserves the desktop
    -- auth binding to one company id while removing demo-only records.
    delete from public.demo_call_notes where company_id = existing_company_id;
    delete from public.demo_leads where company_id = existing_company_id;
    delete from public.demo_accounts where company_id = existing_company_id;
    delete from public.demo_deal_stages where company_id = existing_company_id;

    update public.companies
      set name = trim(company_name),
          manager_count_bucket = manager_bucket,
          main_goal = primary_goal,
          mode = 'real'
      where id = existing_company_id;

    insert into public.crm_connections (company_id, provider, status)
    values (existing_company_id, crm_provider, connection_status)
    on conflict (company_id) do update
      set provider = excluded.provider,
          status = excluded.status,
          external_account_name = null;

    update public.profiles set preferred_language = requested_language, signup_mode = 'real', onboarding_step = 'complete' where id = current_user_id;
    return jsonb_build_object('created', false, 'upgraded', true, 'state', public.signup_state_for(current_user_id));
  end if;

  if existing_company_id is not null then
    return jsonb_build_object('created', false, 'state', public.signup_state_for(current_user_id));
  end if;

  insert into public.companies (name, manager_count_bucket, main_goal, mode, created_by)
  values (trim(company_name), manager_bucket, primary_goal, 'real', current_user_id)
  returning id into new_company_id;
  insert into public.company_members (company_id, user_id, role) values (new_company_id, current_user_id, 'owner');
  insert into public.crm_connections (company_id, provider, status) values (new_company_id, crm_provider, connection_status);
  update public.profiles set preferred_language = requested_language, signup_mode = 'real', onboarding_step = 'complete' where id = current_user_id;
  return jsonb_build_object('created', true, 'state', public.signup_state_for(current_user_id));
end;
$$;

create or replace function public.complete_demo_signup(requested_language text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  current_user_id uuid := auth.uid();
  new_company_id uuid;
  stage_new uuid; stage_discovery uuid; stage_proposal uuid;
  account_northstar uuid; account_aurora uuid;
  lead_one uuid; lead_two uuid; lead_three uuid;
begin
  if current_user_id is null then raise exception 'authentication required'; end if;
  if requested_language not in ('en', 'ru') then raise exception 'invalid language'; end if;
  insert into public.profiles (id) values (current_user_id) on conflict (id) do nothing;
  perform 1 from public.profiles where id = current_user_id for update;
  if exists (select 1 from public.company_members where user_id = current_user_id) then
    return jsonb_build_object('created', false, 'state', public.signup_state_for(current_user_id));
  end if;

  insert into public.companies (name, mode, created_by) values ('LiveAssist Demo', 'demo', current_user_id) returning id into new_company_id;
  insert into public.company_members (company_id, user_id, role) values (new_company_id, current_user_id, 'owner');
  insert into public.crm_connections (company_id, provider, status) values (new_company_id, 'none', 'demo');
  insert into public.demo_deal_stages (company_id, name, position) values
    (new_company_id, 'New lead', 1), (new_company_id, 'Discovery', 2), (new_company_id, 'Proposal', 3);
  select id into stage_new from public.demo_deal_stages where company_id = new_company_id and position = 1;
  select id into stage_discovery from public.demo_deal_stages where company_id = new_company_id and position = 2;
  select id into stage_proposal from public.demo_deal_stages where company_id = new_company_id and position = 3;
  insert into public.demo_accounts (company_id, name) values (new_company_id, 'Northstar Logistics') returning id into account_northstar;
  insert into public.demo_accounts (company_id, name) values (new_company_id, 'Aurora Retail') returning id into account_aurora;
  insert into public.demo_leads (company_id, account_id, stage_id, contact_name, title, value_amount)
    values (new_company_id, account_northstar, stage_discovery, 'Maya Chen', 'Support rollout', 18000) returning id into lead_one;
  insert into public.demo_leads (company_id, account_id, stage_id, contact_name, title, value_amount)
    values (new_company_id, account_aurora, stage_proposal, 'Alex Morgan', 'Sales team pilot', 32000) returning id into lead_two;
  insert into public.demo_leads (company_id, account_id, stage_id, contact_name, title, value_amount)
    values (new_company_id, account_northstar, stage_new, 'Sam Rivera', 'Knowledge base review', 8500) returning id into lead_three;
  insert into public.demo_call_notes (company_id, lead_id, note, happened_at) values
    (new_company_id, lead_one, 'Team wants cited answers during onboarding calls. Security review is the next step.', now() - interval '2 days'),
    (new_company_id, lead_two, 'Pilot approved for five managers. Follow up with deployment checklist.', now() - interval '1 day'),
    (new_company_id, lead_three, 'Asked for a demo using pricing and support documents.', now() - interval '4 hours');
  update public.profiles set preferred_language = requested_language, signup_mode = 'demo', onboarding_step = 'complete' where id = current_user_id;
  return jsonb_build_object('created', true, 'state', public.signup_state_for(current_user_id));
end;
$$;

revoke all on function public.get_signup_state() from public, anon;
revoke all on function public.save_signup_progress(public.signup_mode, text) from public, anon;
revoke all on function public.complete_real_signup(text, text, public.crm_provider, text, text) from public, anon;
revoke all on function public.complete_demo_signup(text) from public, anon;
grant execute on function public.get_signup_state() to authenticated;
grant execute on function public.save_signup_progress(public.signup_mode, text) to authenticated;
grant execute on function public.complete_real_signup(text, text, public.crm_provider, text, text) to authenticated;
grant execute on function public.complete_demo_signup(text) to authenticated;
