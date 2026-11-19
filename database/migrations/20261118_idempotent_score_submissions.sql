-- Arad Explorer: idempotent score submission migration.
-- Apply only after verifying the live Arad schema and testing on a backup/staging project.
-- This migration preserves the existing record_place_result function and wraps it
-- in a transaction keyed by (authenticated user, client-generated submission UUID).

create table if not exists public.place_result_submissions (
  user_id uuid not null references auth.users(id) on delete cascade,
  submission_id uuid not null,
  response jsonb,
  created_at timestamptz not null default now(),
  primary key (user_id, submission_id)
);

alter table public.place_result_submissions enable row level security;
revoke all on public.place_result_submissions from anon, authenticated, public;
grant select, insert, update on public.place_result_submissions to authenticated;

-- The RPC runs as the caller, so RLS remains active. Each account can only
-- see and maintain its own idempotency records.
drop policy if exists "score submissions: read own" on public.place_result_submissions;
create policy "score submissions: read own"
  on public.place_result_submissions for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "score submissions: insert own" on public.place_result_submissions;
create policy "score submissions: insert own"
  on public.place_result_submissions for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "score submissions: update own" on public.place_result_submissions;
create policy "score submissions: update own"
  on public.place_result_submissions for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace function public.record_place_result_idempotent(
  p_place_id text, p_score int, p_max int, p_submission_id uuid
)
returns json
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
declare
  uid uuid := auth.uid();
  saved jsonb;
  inserted_id uuid;
  result_json json;
begin
  if uid is null then raise exception 'not signed in'; end if;
  if p_submission_id is null then raise exception 'submission id required'; end if;

  insert into public.place_result_submissions(user_id, submission_id)
  values (uid, p_submission_id)
  on conflict (user_id, submission_id) do nothing
  returning submission_id into inserted_id;

  if inserted_id is null then
    select response into saved
    from public.place_result_submissions
    where user_id = uid and submission_id = p_submission_id;
    if saved is null then raise exception 'submission is still processing; retry safely'; end if;
    return saved::json;
  end if;

  result_json := public.record_place_result(p_place_id, p_score, p_max);
  update public.place_result_submissions
  set response = result_json::jsonb
  where user_id = uid and submission_id = p_submission_id;
  return result_json;
end;
$$;

revoke all on function public.record_place_result_idempotent(text, int, int, uuid) from anon, public;
grant execute on function public.record_place_result_idempotent(text, int, int, uuid) to authenticated;
