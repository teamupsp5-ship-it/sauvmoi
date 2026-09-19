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
  -- Révocation de la fiche médicale publique (QR) : horodatage de la
  -- dernière génération réelle d'un QR pour ce profil, mis à jour à chaque
  -- appel de GET /medical-record/qr. La route publique
  -- /public/medical-card/:file refuse toute URL (même valablement signée,
  -- voir MEDICAL_CARD_SECRET) dont le gen est antérieur à cette valeur —
  -- c'est ce qui invalide réellement un ancien QR dès qu'un nouveau est
  -- généré, une signature seule ne faisant qu'empêcher la falsification de
  -- l'URL, pas la réutilisation d'une ancienne URL toujours signée.
  qr_generated_at timestamptz,
  -- Justificatif de groupe sanguin (lot 8) — trois états, jamais atteignable
  -- à "verified" par une route existante : aucune interface de validation
  -- médicale n'existe encore, cette colonne prépare uniquement la lecture.
  blood_type_status text not null default 'declared'
    check (blood_type_status in ('declared', 'pending', 'verified')),
  blood_type_proof_path text,        -- chemin dans le bucket Storage privé, jamais une URL publique
  blood_type_verified_at timestamptz,
  blood_type_verified_by uuid references auth.users(id),
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

-- Centres de santé (couverture nationale Côte d'Ivoire) — alimentée par
-- scripts/sync-health-centers.js depuis l'API healthsites.io (données
-- OpenStreetMap, licence ODbL — voir CLAUDE.md, section Localisation).
-- Remplace la liste statique de 20 centres de San Pédro auparavant codée en
-- dur dans src/data/health-centers.js. Table de référence publique, pas de
-- user_id : entièrement gérée par le script de sync, lue par le backend
-- (service_role) via GET /api/health-centers.
create table health_centers (
  -- "<osm_type>/<osm_id>" (ex. "node/2828406228") plutôt que l'osm_id seul :
  -- un identifiant OSM numérique n'est unique que DANS son type (node/way/
  -- relation partagent le même espace de numérotation, deux entités de
  -- types différents peuvent avoir le même id numérique).
  id text primary key,
  name text not null,
  -- Déduit des tags OSM amenity/healthcare par scripts/sync-health-centers.js
  -- (voir TYPE_MAP dans ce script pour le détail du mapping).
  type text not null check (type in ('hopital', 'clinique', 'pharmacie', 'centre_sante', 'autre')),
  lat float8 not null,
  lng float8 not null,
  phone text,
  address text,
  -- 'healthsites.io' pour toute ligne issue du sync ; 'seed-manuel' pour les
  -- 20 lignes de démarrage insérées avant le tout premier sync réel (voir
  -- bloc MIGRATION plus bas) — pas de contrainte CHECK ici, d'autres valeurs
  -- de source pourront apparaître plus tard.
  source text not null default 'healthsites.io',
  synced_at timestamptz not null default now()
);

alter table health_centers enable row level security;
-- Aucune policy créée volontairement — voir l'avertissement RLS dans la
-- section Sécurité de CLAUDE.md (une policy RLS ACCORDE des droits, elle
-- n'en retire jamais ; l'absence de policy est le refus par défaut
-- recherché ici). Personne ne doit lire cette table directement depuis un
-- client anon/authenticated : seul le backend (service_role, qui contourne
-- RLS comme pour toutes les autres tables) la sert, via GET /api/health-centers.

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

-- ============================================================================
-- Stockage — justificatif de groupe sanguin (lot 8)
--
-- Bucket PRIVÉ (public = false) : jamais d'URL publique, jamais de lien
-- devinable. Le backend y accède uniquement via le client service_role
-- (src/supabase.js), qui contourne RLS comme pour les 4 tables existantes —
-- c'est requireAuth + la vérification "propriétaire uniquement" côté
-- backend (routes/api.js) qui filtrent réellement les accès aujourd'hui.
--
-- ⚠️ AUCUNE policy RLS n'est créée sur ce bucket — volontairement, ne pas
-- en ajouter une. Une policy RLS ACCORDE des droits, elle n'en retire
-- jamais, et plusieurs policies permissives sur une même table se
-- combinent par OU (la moins restrictive gagne). RLS est actif par défaut
-- sur storage.objects : sans AUCUNE policy permissive, ni le rôle anon ni
-- un utilisateur authentifié n'ont le moindre accès à AUCUN bucket — c'est
-- exactement la protection voulue ici, obtenue par l'ABSENCE de policy,
-- pas par une policy qui "refuserait" l'accès (ce mécanisme n'existe pas
-- en RLS Postgres/Supabase).
--
-- Une version précédente de ce fichier créait ici
-- `create policy ... using (bucket_id != 'blood-type-proofs')` en pensant
-- interdire l'accès à ce bucket. Elle faisait l'inverse : sans clause
-- `to`, elle s'appliquait à PUBLIC (anonyme compris) et ACCORDAIT un accès
-- en lecture/écriture à TOUS LES AUTRES buckets Storage du projet — sans
-- effet tant qu'aucun autre bucket n'existait, mais le prochain bucket
-- créé se serait retrouvé ouvert à des utilisateurs non authentifiés.
-- Jamais exécutée en production (voir historique du dépôt). Si un accès
-- direct depuis le navigateur devient un jour nécessaire pour CE bucket,
-- la policy correspondante doit porter une clause `to authenticated` et
-- une condition qui restreint réellement aux lignes autorisées — jamais
-- une condition qui ne fait qu'EXCLURE ce bucket en laissant les autres
-- ouverts par accident.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('blood-type-proofs', 'blood-type-proofs', false)
on conflict (id) do nothing;

-- ============================================================================
-- MIGRATION — base de production existante
--
-- Ce fichier sert de script de démarrage pour une base NEUVE (create table
-- échoue si les tables existent déjà). Sur un projet Supabase déjà en
-- production (table profiles déjà créée), exécutez UNIQUEMENT le bloc
-- ci-dessous dans l'éditeur SQL — pas le fichier en entier. Idempotent
-- (if not exists / on conflict do nothing), sans risque à rejouer.
-- ============================================================================
alter table profiles add column if not exists qr_generated_at timestamptz;

alter table profiles add column if not exists blood_type_status text not null default 'declared';
alter table profiles drop constraint if exists profiles_blood_type_status_check;
alter table profiles add constraint profiles_blood_type_status_check
  check (blood_type_status in ('declared', 'pending', 'verified'));
alter table profiles add column if not exists blood_type_proof_path text;
alter table profiles add column if not exists blood_type_verified_at timestamptz;
alter table profiles add column if not exists blood_type_verified_by uuid references auth.users(id);

insert into storage.buckets (id, name, public)
values ('blood-type-proofs', 'blood-type-proofs', false)
on conflict (id) do nothing;

-- Nettoyage : supprime la policy erronée d'une exécution précédente de ce
-- fichier, si elle a été appliquée quelque part (jamais en production,
-- voir la note dans la section Stockage ci-dessus). N'en recrée AUCUNE —
-- l'absence de policy est la protection voulue sur ce bucket, pas une
-- policy qui semblerait "refuser" l'accès.
drop policy if exists "blood_type_proofs_no_direct_access" on storage.objects;

-- ============================================================================
-- MIGRATION — centres de santé, couverture nationale (remplace la liste
-- statique de San Pédro codée en dur dans src/data/health-centers.js)
-- ============================================================================
create table if not exists health_centers (
  id text primary key,
  name text not null,
  type text not null check (type in ('hopital', 'clinique', 'pharmacie', 'centre_sante', 'autre')),
  lat float8 not null,
  lng float8 not null,
  phone text,
  address text,
  source text not null default 'healthsites.io',
  synced_at timestamptz not null default now()
);
alter table health_centers enable row level security;

-- Seed initial : les 20 centres de San Pédro déjà présents dans
-- src/data/health-centers.js (fichier laissé en place mais plus lu par le
-- backend après ce lot), insérés avec source = 'seed-manuel' pour ne
-- jamais dépendre du tout premier sync healthsites.io — si ce sync échoue
-- ou tarde, la carte affiche quand même ces 20 centres au lieu d'être vide.
-- Identifiants préfixés "seed/" (jamais "node/"/"way/"/"relation/", le
-- format utilisé par le sync réel) pour ne jamais entrer en collision avec
-- une ligne issue de healthsites.io. on conflict do nothing : rejouer ce
-- fichier ne réécrase jamais une ligne déjà présente (ex. après un premier
-- sync réel qui aurait déjà synchronisé ces mêmes établissements sous leur
-- vrai id OSM — les deux lignes coexistent alors, un nettoyage manuel des
-- lignes source = 'seed-manuel' peut être fait à ce moment-là si souhaité).
insert into health_centers (id, name, type, lat, lng, phone, address, source) values
  ('seed/hg-san-pedro', 'Hôpital Général (HG) de San Pedro', 'hopital', 4.747568, -6.635152, null, null, 'seed-manuel'),
  ('seed/chr-san-pedro', 'Centre Hospitalier Régional (CHR) de San Pedro', 'hopital', 4.784555, -6.699763, null, null, 'seed-manuel'),
  ('seed/clinic-notre-dame', 'Medical Clinic Notre Dame', 'clinique', 4.744491, -6.635397, '+225 27 34 71 35 35', null, 'seed-manuel'),
  ('seed/espace-pasteur', 'Espace Médical Pasteur', 'clinique', 4.747617, -6.631029, '+225 27 34 71 86 06', null, 'seed-manuel'),
  ('seed/clinical-power-plant', 'Clinical Power Plant San Pedro', 'clinique', 4.747772, -6.629602, '+225 07 47 81 81 21', null, 'seed-manuel'),
  ('seed/clinic-begnanko', 'Medical Clinic Begnanko', 'clinique', 4.737333, -6.646455, '+225 07 48 57 96 45', null, 'seed-manuel'),
  ('seed/clinique-emmanuel', 'Clinique Médico-Chirurgicale L''Emmanuel', 'clinique', 4.778827, -6.652021, '+225 07 09 22 30 68', null, 'seed-manuel'),
  ('seed/centre-achifa', 'Centre Médical Achifa', 'clinique', 4.750114, -6.634968, null, null, 'seed-manuel'),
  ('seed/centre-la-grace', 'Centre Médical La Grâce', 'clinique', 4.745371, -6.653120, null, null, 'seed-manuel'),
  ('seed/centre-maman-louise', 'Centre Médical Maman Louise', 'clinique', 4.769273, -6.667515, '+225 07 89 49 08 15', null, 'seed-manuel'),
  ('seed/clinique-rochers', 'Clinique des Rochers', 'clinique', 4.739267, -6.631905, '+225 27 34 71 48 52', null, 'seed-manuel'),
  ('seed/clinique-renaissance', 'Clinique La Renaissance San Pedro', 'clinique', 4.747013, -6.633425, '+225 07 10 24 67 33', null, 'seed-manuel'),
  ('seed/maternite-zara', 'Maternité Zara de Digboué', 'clinique', 4.748684, -6.693746, '+225 05 95 12 15 25', null, 'seed-manuel'),
  ('seed/csu-dafci', 'CSU DAFCI San-Pedro', 'centre_sante', 4.777289, -6.686609, '+225 05 66 66 08 66', null, 'seed-manuel'),
  ('seed/el-rapha-social', 'Espace de Santé et Promotion Sociale El Rapha', 'centre_sante', 4.765230, -6.676083, '+225 07 07 38 62 72', null, 'seed-manuel'),
  ('seed/health-center-rapha', 'Health Center Le Rapha', 'centre_sante', 4.766676, -6.678662, '+225 07 07 32 15 55', null, 'seed-manuel'),
  ('seed/ong-cerbas', 'ONG CERBAS (centre de santé)', 'centre_sante', 4.761192, -6.667324, null, null, 'seed-manuel'),
  ('seed/dispensaire-urbain', 'Dispensaire Urbain de San Pedro', 'centre_sante', 4.771773, -6.654238, null, null, 'seed-manuel'),
  ('seed/pmi-bardot', 'PMI Bardot San Pedro', 'centre_sante', 4.771569, -6.654413, null, null, 'seed-manuel'),
  ('seed/centre-antituberculeux', 'Centre Antituberculeux de San-Pédro', 'centre_sante', 4.757890, -6.642369, '+225 27 34 71 69 28', null, 'seed-manuel')
on conflict (id) do nothing;
