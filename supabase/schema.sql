-- ============================================================================
-- Sauv'Moi — schéma Supabase
--
-- À EXÉCUTER MANUELLEMENT dans l'éditeur SQL de votre projet Supabase
-- (Dashboard → SQL Editor → New query → coller ce fichier → Run)
-- AVANT de déployer le nouveau backend, sinon toutes les routes
-- auth/profil/formation/SOS échoueront.
-- ============================================================================

-- Table profils (liée à auth.users)
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  phone text,
  birthdate date,
  gender text,
  photo text,
  city text default 'Abidjan',
  role text default 'Citoyen',
  lang text default 'FR',
  blood_type text,
  -- Ajoutés par rapport à la spec d'origine : le frontend existant
  -- (calcul de complétion du profil, écran "Profil médical") lit et écrit
  -- déjà height/weight — sans ces colonnes ces champs seraient perdus.
  height numeric,
  weight numeric,
  allergies text,
  conditions text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Contacts d'urgence
create table emergency_contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  name text not null,
  phone text not null,
  relation text,
  created_at timestamptz default now()
);

-- Progression formation
create table training_progress (
  user_id uuid references profiles(id) on delete cascade primary key,
  completed_modules text[] default '{}',
  scores jsonb default '{}',
  updated_at timestamptz default now()
);

-- Notifications SOS
create table notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  type text not null,
  from_user text,
  message text,
  lat float8,
  lng float8,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- Row Level Security : chaque utilisateur accède
-- uniquement à ses propres données
alter table profiles enable row level security;
alter table emergency_contacts enable row level security;
alter table training_progress enable row level security;
alter table notifications enable row level security;

create policy "Users manage own profile" on profiles
  for all using (auth.uid() = id);
create policy "Users manage own contacts" on emergency_contacts
  for all using (auth.uid() = user_id);
create policy "Users manage own training" on training_progress
  for all using (auth.uid() = user_id);
create policy "Users manage own notifications" on notifications
  for all using (auth.uid() = user_id);

-- Trigger : créer automatiquement un profil vide
-- à l'inscription
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, phone)
  values (new.id, new.raw_user_meta_data->>'name',
          new.raw_user_meta_data->>'phone');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
