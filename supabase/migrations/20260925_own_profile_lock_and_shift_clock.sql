-- ============================================================================
-- TranziIQ OS — Own-profile lock, sign-in clock-in, department shift risk
-- assessments. Run once in Supabase → SQL Editor (safe to re-run).
-- ============================================================================

-- 1. New columns ------------------------------------------------------------
alter table public.shift_log
  add column if not exists employee_id      text,
  add column if not exists department       text,
  add column if not exists job_title        text,
  add column if not exists clock_in_method  text,   -- 'login'
  add column if not exists clock_out_method text;   -- 'logout' | 'hr' | 'missed' | 'duplicate'

alter table public.shift_risk_assessment
  add column if not exists employee_id     text,
  add column if not exists department      text,
  add column if not exists job_title       text,
  add column if not exists shift_log_id    text,
  add column if not exists assessment_type text,    -- transport | engineering | stores | production | sherq | office
  add column if not exists checklist_data  jsonb,
  add column if not exists stop_work       boolean default false;

create index if not exists shift_log_active_person_idx
  on public.shift_log (status, employee_id, driver_id);
create index if not exists shift_risk_assessment_shift_idx
  on public.shift_risk_assessment (shift_log_id);

-- 2. Helpers ----------------------------------------------------------------
-- IDs of the signed-in person's OWN employee and driver records.
create or replace function public.tz_my_person_ids()
returns text[]
language sql stable security definer set search_path = public as $$
  select coalesce(
    array_remove(array[p.linked_employee_id::text, p.linked_driver_id::text], null),
    '{}'::text[])
  from public.profiles p
  where p.id = auth.uid();
$$;

-- Company admin, or staff with the HR or SHERQ module (they manage
-- everyone's attendance and assessments).
create or replace function public.tz_is_shift_manager()
returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and (p.role = 'admin'
           or 'hr'   = any(coalesce(p.module_access, '{}'::text[]))
           or 'sheq' = any(coalesce(p.module_access, '{}'::text[])))
  );
$$;

grant execute on function public.tz_my_person_ids()   to authenticated;
grant execute on function public.tz_is_shift_manager() to authenticated;

-- 3. Nobody can re-link their own login to someone else's profile ------------
-- Only a company admin may change which employee / driver a login belongs to.
-- (Invite acceptance and other server-side functions are not affected.)
create or replace function public.tz_protect_profile_links()
returns trigger
language plpgsql as $$
begin
  if current_user <> 'authenticated' then
    return new;  -- service role / security-definer server functions
  end if;
  if (new.linked_employee_id is distinct from old.linked_employee_id
      or new.linked_driver_id is distinct from old.linked_driver_id)
     and not exists (
       select 1 from public.profiles a
       where a.id = auth.uid() and a.role = 'admin' and a.org_id = old.org_id)
  then
    raise exception 'Only an administrator can change which employee profile a login is linked to';
  end if;
  return new;
end;
$$;

drop trigger if exists tz_protect_profile_links on public.profiles;
create trigger tz_protect_profile_links
  before update on public.profiles
  for each row execute function public.tz_protect_profile_links();

-- 4. Shifts and shift risk assessments: own records only ---------------------
-- RESTRICTIVE policies are added ON TOP of the existing company (org_id)
-- policies: a normal employee can only create / change their own clock-ins
-- and their own assessments. Admin, HR and SHERQ users can manage everyone's.
drop policy if exists tz_own_shift_insert on public.shift_log;
create policy tz_own_shift_insert on public.shift_log
  as restrictive for insert to authenticated
  with check (public.tz_is_shift_manager()
              or driver_id   = any(public.tz_my_person_ids())
              or employee_id = any(public.tz_my_person_ids()));

drop policy if exists tz_own_shift_update on public.shift_log;
create policy tz_own_shift_update on public.shift_log
  as restrictive for update to authenticated
  using (public.tz_is_shift_manager()
         or driver_id   = any(public.tz_my_person_ids())
         or employee_id = any(public.tz_my_person_ids()))
  with check (public.tz_is_shift_manager()
              or driver_id   = any(public.tz_my_person_ids())
              or employee_id = any(public.tz_my_person_ids()));

drop policy if exists tz_own_shift_delete on public.shift_log;
create policy tz_own_shift_delete on public.shift_log
  as restrictive for delete to authenticated
  using (public.tz_is_shift_manager());

drop policy if exists tz_own_sra_insert on public.shift_risk_assessment;
create policy tz_own_sra_insert on public.shift_risk_assessment
  as restrictive for insert to authenticated
  with check (public.tz_is_shift_manager()
              or driver_id   = any(public.tz_my_person_ids())
              or employee_id = any(public.tz_my_person_ids()));

drop policy if exists tz_own_sra_update on public.shift_risk_assessment;
create policy tz_own_sra_update on public.shift_risk_assessment
  as restrictive for update to authenticated
  using (public.tz_is_shift_manager())
  with check (public.tz_is_shift_manager());

drop policy if exists tz_own_sra_delete on public.shift_risk_assessment;
create policy tz_own_sra_delete on public.shift_risk_assessment
  as restrictive for delete to authenticated
  using (public.tz_is_shift_manager());

-- 5. Check: these policies only work if RLS is on for both tables -----------
do $$
declare t text;
begin
  foreach t in array array['shift_log', 'shift_risk_assessment', 'profiles'] loop
    if not (select relrowsecurity from pg_class where oid = ('public.' || t)::regclass) then
      raise warning 'Row Level Security is OFF on public.% — the own-profile rules will not apply until it is enabled', t;
    end if;
  end loop;
end $$;

notify pgrst, 'reload schema';
