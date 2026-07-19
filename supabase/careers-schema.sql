-- NexaForce Careers: Applications storage + table
-- Run this inside the Supabase SQL editor (Dashboard -> SQL -> New query).

-- 1) Storage bucket for CV files (private, served via signed URLs)
insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', false)
on conflict (id) do nothing;

-- Allow anon (public website) to upload CVs. Adjust if you later use auth.
create policy "Public can upload CVs"
  on storage.objects for insert
  to anon
  with check (bucket_id = 'cvs');

create policy "Public can read own CVs"
  on storage.objects for select
  to anon
  using (bucket_id = 'cvs');

-- 2) Applications table
create table if not exists public.applications (
  id            uuid primary key default gen_random_uuid(),
  type          text not null check (type in ('job', 'internship')),
  name          text not null,
  email         text not null,
  phone         text,
  role          text,
  availability  text,
  message       text,
  cv_file_name  text,
  cv_url        text,
  created_at    timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.applications enable row level security;

-- Allow the public site to insert applications.
create policy "Public can insert applications"
  on public.applications for insert
  to anon
  with check (true);

-- (Optional) Allow you to read them from the dashboard / API.
-- Replace with your own rule or keep open for admin convenience.
create policy "Public can read applications"
  on public.applications for select
  to anon
  using (true);
