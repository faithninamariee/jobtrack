-- JobTrack Supabase schema
-- Run this entire file in Supabase Dashboard > SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  position text not null,
  company text not null,
  salary_range text,
  location text,
  job_type text check (job_type in ('Remote', 'Hybrid', 'Onsite')),
  job_classification text check (job_classification in ('Part time', 'Fulltime', 'Contractual')),
  date_posted date,
  date_applied date,
  status text not null default 'Applied'
    check (status in ('Applied', 'Initial Interview', 'Technical Interview', 'Final Interview', 'Accepted', 'Rejected')),
  notes text,
  source text check (source in ('LinkedIn', 'JobStreet', 'Indeed', 'Kalibrr', 'Email', 'Facebook', 'Company Website', 'Referral', 'Other')),
  job_post_link text,
  roles_responsibilities text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists applications_user_id_idx on public.applications(user_id);
create index if not exists applications_date_applied_idx on public.applications(date_applied);
create index if not exists applications_status_idx on public.applications(status);

alter table public.applications enable row level security;

drop policy if exists "Users can view their own applications" on public.applications;
create policy "Users can view their own applications"
on public.applications for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert their own applications" on public.applications;
create policy "Users can insert their own applications"
on public.applications for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update their own applications" on public.applications;
create policy "Users can update their own applications"
on public.applications for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own applications" on public.applications;
create policy "Users can delete their own applications"
on public.applications for delete
using (auth.uid() = user_id);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists applications_set_updated_at on public.applications;
create trigger applications_set_updated_at
before update on public.applications
for each row execute procedure public.set_updated_at();
