-- ============================================================
-- JOBWISE — Run this in Supabase SQL Editor before deploying
-- ============================================================
create extension if not exists "uuid-ossp";

-- Profiles (auto-created on signup)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text,
  created_at timestamptz default now()
);
alter table public.profiles enable row level security;
create policy "own profile" on public.profiles for all using (auth.uid() = id);

-- CVs
create table public.cvs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  file_name text not null,
  raw_text text not null,
  parsed_json jsonb,
  seniority_level text,
  is_active boolean default true,
  created_at timestamptz default now()
);
alter table public.cvs enable row level security;
create policy "own cvs" on public.cvs for all using (auth.uid() = user_id);

-- Job applications
create table public.applications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  cv_id uuid references public.cvs(id),
  job_title text not null,
  company text,
  location text,
  salary text,
  job_type text default 'CDI',
  source text,
  job_description text not null,
  status text default 'draft' check (status in ('draft','applied','interview','offer','rejected')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.applications enable row level security;
create policy "own applications" on public.applications for all using (auth.uid() = user_id);

-- AI outputs
create table public.ai_outputs (
  id uuid default uuid_generate_v4() primary key,
  application_id uuid references public.applications(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  match_score integer,
  strengths jsonb default '[]',
  gaps jsonb default '[]',
  deal_breakers jsonb default '[]',
  honest_summary text,
  tailored_bullets jsonb default '[]',
  cover_letter text,
  linkedin_messages jsonb default '[]',
  screening_qa jsonb default '[]',
  generated_at timestamptz default now()
);
alter table public.ai_outputs enable row level security;
create policy "own outputs" on public.ai_outputs for all using (auth.uid() = user_id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger applications_updated_at
  before update on public.applications
  for each row execute procedure public.set_updated_at();
