-- ============================================
-- Pundi — Supabase PostgreSQL Schema
-- ============================================


-- 1. Profiles / User Progress Table
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  xp integer default 0 not null,
  level integer default 1 not null,
  streak_days integer default 0 not null,
  last_activity_date date,
  badges text[] default '{}'::text[] not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.profiles enable row level security;

create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Trigger to automatically create profile on sign up
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, xp, level, streak_days, badges)
  values (new.id, 0, 1, 0, '{}'::text[]);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- 2. Wallets / Kantong Table
create table public.wallets (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  name text not null,
  type text not null, -- cash, bank, ewallet, etc.
  balance bigint default 0 not null, -- integer representation of IDR
  color text not null, -- hex color
  icon text not null, -- icon identifier
  "order" integer default 0 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.wallets enable row level security;

create policy "Users can manage own wallets" on public.wallets
  for all using (auth.uid() = user_id);


-- 3. Transactions Table
create table public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null, -- income, expense, transfer
  amount bigint not null,
  category_id text not null,
  wallet_id uuid references public.wallets(id) on delete cascade not null,
  target_wallet_id uuid references public.wallets(id) on delete cascade, -- for transfers
  note text,
  receipt_url text,
  date timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.transactions enable row level security;

create policy "Users can manage own transactions" on public.transactions
  for all using (auth.uid() = user_id);


-- 4. Debts / Hutang Saya
create table public.debts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  creditor text not null,
  total_amount bigint not null,
  remaining_amount bigint not null,
  interest_rate double precision,
  due_date date,
  payment_schedule text,
  status text default 'active' not null, -- active, paid_off
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.debts enable row level security;

create policy "Users can manage own debts" on public.debts
  for all using (auth.uid() = user_id);


-- 5. Receivables / Hutang Orang (Piutang)
create table public.receivables (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  debtor text not null,
  total_amount bigint not null,
  remaining_amount bigint not null,
  status text default 'unpaid' not null, -- unpaid, partial, paid
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.receivables enable row level security;

create policy "Users can manage own receivables" on public.receivables
  for all using (auth.uid() = user_id);


-- 6. Receivable Payments / Cicilan Piutang
create table public.receivable_payments (
  id uuid default gen_random_uuid() primary key,
  receivable_id uuid references public.receivables(id) on delete cascade not null,
  amount bigint not null,
  date timestamp with time zone default timezone('utc'::text, now()) not null,
  note text
);

alter table public.receivable_payments enable row level security;

-- Users can query payments of their own receivables
create policy "Users can manage own receivable payments" on public.receivable_payments
  for all using (
    exists (
      select 1 from public.receivables r
      where r.id = receivable_payments.receivable_id
      and r.user_id = auth.uid()
    )
  );


-- 7. Split Bill Sessions
create table public.split_bill_sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text not null,
  total_amount bigint not null,
  method text not null, -- equal, custom, percentage
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.split_bill_sessions enable row level security;

create policy "Users can manage own split bill sessions" on public.split_bill_sessions
  for all using (auth.uid() = user_id);


-- 8. Split Participants
create table public.split_participants (
  id uuid default gen_random_uuid() primary key,
  session_id uuid references public.split_bill_sessions(id) on delete cascade not null,
  name text not null,
  amount bigint not null,
  status text default 'unpaid' not null, -- unpaid, paid
  receivable_id uuid references public.receivables(id) on delete set null
);

alter table public.split_participants enable row level security;

create policy "Users can manage own split participants" on public.split_participants
  for all using (
    exists (
      select 1 from public.split_bill_sessions s
      where s.id = split_participants.session_id
      and s.user_id = auth.uid()
    )
  );


-- 9. Automatic Updated At Timestamp Trigger function
create or replace function public.update_modified_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply triggers
create trigger update_profiles_updated_at before update on public.profiles for each row execute procedure public.update_modified_column();
create trigger update_wallets_updated_at before update on public.wallets for each row execute procedure public.update_modified_column();
create trigger update_transactions_updated_at before update on public.transactions for each row execute procedure public.update_modified_column();
create trigger update_debts_updated_at before update on public.debts for each row execute procedure public.update_modified_column();
create trigger update_receivables_updated_at before update on public.receivables for each row execute procedure public.update_modified_column();
