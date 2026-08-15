-- ===========================================================================
-- votos-tae · esquema completo
-- ---------------------------------------------------------------------------
-- Pegar entero en Supabase -> SQL Editor -> Run. Es idempotente: se puede
-- volver a correr sin romper nada.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 1. Opciones (los 4 finales). Son siempre las mismas en todas las funciones.
-- ---------------------------------------------------------------------------
create table if not exists public.options (
  id          text primary key,          -- slug corto y estable: 'a', 'vera', ...
  name        text not null,             -- nombre del personaje / final
  subtitle    text,                      -- bajada corta, se ve en la tarjeta
  blurb       text,                      -- parrafo de acusacion (variantes swipe/stack)
  color       text not null default '#8b5cf6',  -- color de acento de la tarjeta
  image_url   text,                      -- foto/silueta recortada (PNG con alpha)
  sort_order  integer not null default 0
);

-- ---------------------------------------------------------------------------
-- 2. Funciones (cada pasada de la obra)
-- ---------------------------------------------------------------------------
-- status:
--   idle     -> creada, el publico ve "la votacion todavia no abrio"
--   open     -> se puede votar
--   closed   -> votacion cerrada, se muestra el resultado
--   finished -> funcion archivada, ya no es la funcion actual
--
-- results_visibility (que ve el PUBLICO mientras la votacion esta abierta):
--   live       -> barras en vivo desde el primer voto
--   after_vote -> ve los conteos recien despues de emitir su voto
--   hidden     -> no ve conteos hasta que el admin cierra la votacion
create table if not exists public.shows (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  status             text not null default 'idle'
                       check (status in ('idle', 'open', 'closed', 'finished')),
  results_visibility text not null default 'after_vote'
                       check (results_visibility in ('live', 'after_vote', 'hidden')),
  winner_option_id   text references public.options (id) on delete set null,
  created_at         timestamptz not null default now(),
  opened_at          timestamptz,
  closed_at          timestamptz,
  finished_at        timestamptz
);

-- Como maximo UNA funcion viva (no finalizada) a la vez. Este indice parcial es
-- lo que garantiza que /votar nunca tenga que adivinar cual es la funcion actual.
create unique index if not exists shows_single_live
  on public.shows ((status <> 'finished'))
  where status <> 'finished';

-- ---------------------------------------------------------------------------
-- 3. Votos
-- ---------------------------------------------------------------------------
create table if not exists public.votes (
  id         uuid primary key default gen_random_uuid(),
  show_id    uuid not null references public.shows (id) on delete cascade,
  option_id  text not null references public.options (id) on delete cascade,
  device_id  text not null,
  -- sha256(ip + AUTH_SECRET). Guardamos el hash y no la IP: alcanza para contar
  -- votos por conexion (VOTE_IP_LIMIT) sin almacenar un dato personal.
  ip_hash    text,
  created_at timestamptz not null default now(),
  -- un voto por dispositivo por funcion
  unique (show_id, device_id)
);

create index if not exists votes_show_idx on public.votes (show_id);
create index if not exists votes_ip_idx on public.votes (show_id, ip_hash);

alter table public.votes add column if not exists ip_hash text;

-- ---------------------------------------------------------------------------
-- 4. Conteos materializados
-- ---------------------------------------------------------------------------
-- Se podria hacer count(*) sobre votes, pero tener una fila por (funcion,
-- opcion) permite que Realtime empuje el nuevo numero a todos los celulares
-- sin que ninguno tenga que reconsultar la tabla entera.
create table if not exists public.tallies (
  show_id   uuid not null references public.shows (id) on delete cascade,
  option_id text not null references public.options (id) on delete cascade,
  count     integer not null default 0,
  primary key (show_id, option_id)
);

-- Al crear una funcion, arrancar todas las opciones en 0 para que el publico
-- vea las 4 barras desde el minuto cero.
create or replace function public.seed_tallies()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.tallies (show_id, option_id, count)
  select new.id, o.id, 0 from public.options o
  on conflict do nothing;
  return new;
end;
$$;

drop trigger if exists shows_seed_tallies on public.shows;
create trigger shows_seed_tallies
  after insert on public.shows
  for each row execute function public.seed_tallies();

-- Mantener el conteo al insertar / borrar votos.
create or replace function public.sync_tally()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.tallies (show_id, option_id, count)
    values (new.show_id, new.option_id, 1)
    on conflict (show_id, option_id)
      do update set count = public.tallies.count + 1;
    return new;
  elsif tg_op = 'DELETE' then
    update public.tallies
       set count = greatest(count - 1, 0)
     where show_id = old.show_id and option_id = old.option_id;
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists votes_sync_tally on public.votes;
create trigger votes_sync_tally
  after insert or delete on public.votes
  for each row execute function public.sync_tally();

-- ---------------------------------------------------------------------------
-- 5. RLS
-- ---------------------------------------------------------------------------
-- La anon key viaja al celular del publico, asi que solo le damos SELECT.
-- Los votos se insertan desde /api/vote con la service role key, que corre
-- unicamente en el servidor: nadie puede escribir la base desde afuera.
alter table public.options  enable row level security;
alter table public.shows    enable row level security;
alter table public.votes    enable row level security;
alter table public.tallies  enable row level security;

drop policy if exists options_read  on public.options;
drop policy if exists shows_read    on public.shows;
drop policy if exists tallies_read  on public.tallies;

create policy options_read on public.options
  for select to anon, authenticated using (true);

create policy shows_read on public.shows
  for select to anon, authenticated using (true);

-- Los conteos se pueden leer solo cuando la funcion los hizo publicos. En modo
-- `hidden` la anon key no ve absolutamente nada, ni siquiera por websocket.
--
-- Nota honesta sobre `after_vote`: ahi la tabla SI es legible, porque el que ya
-- voto necesita recibir las actualizaciones en vivo. Alguien con la consola del
-- navegador abierta podria espiar los conteos antes de votar. Es una barrera de
-- interfaz contra el efecto manada, no un secreto criptografico. Si hace falta
-- que sea hermetico hasta el cierre, usar `hidden`.
create policy tallies_read on public.tallies
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.shows s
      where s.id = tallies.show_id
        and (
          s.status in ('closed', 'finished')
          or (s.status = 'open' and s.results_visibility in ('live', 'after_vote'))
        )
    )
  );

-- Sin politicas sobre `votes`: con RLS activo y cero policies, la anon key no
-- puede leer ni escribir votos individuales (quien voto que queda privado).
-- La service role key ignora RLS por diseno.

-- Grants explicitos. Supabase ya suele darlos por default, pero dejarlos
-- escritos hace que el esquema no dependa de la configuracion del proyecto, y
-- el revoke sobre `votes` deja el voto individual fuera de alcance aun si
-- alguien agrega una policy por accidente.
grant usage on schema public to anon, authenticated;
grant select on public.options, public.shows, public.tallies to anon, authenticated;
revoke all on public.votes from anon, authenticated;

-- ---------------------------------------------------------------------------
-- 6. Realtime
-- ---------------------------------------------------------------------------
-- `tallies` empuja los conteos; `shows` empuja abrir/cerrar votacion y los
-- cambios de visibilidad de resultados.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'tallies'
  ) then
    alter publication supabase_realtime add table public.tallies;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = 'shows'
  ) then
    alter publication supabase_realtime add table public.shows;
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- 7. Las 4 opciones
-- ---------------------------------------------------------------------------
-- >>> EDITAR ACA con los personajes reales de la obra. <<<
-- Cambiar name/subtitle/blurb/color libremente. Los `id` conviene dejarlos
-- fijos una vez que hubo funciones reales, porque los votos los referencian.
insert into public.options (id, name, subtitle, blurb, color, sort_order) values
  ('a', 'Personaje A', 'La heredera',      'Tenia el motivo mas antiguo de todos: el dinero que nunca le tocó.',        '#e11d48', 1),
  ('b', 'Personaje B', 'El socio',         'Sabia exactamente cuanto valia ese silencio, y cuanto costaba romperlo.',   '#f59e0b', 2),
  ('c', 'Personaje C', 'La institutriz',   'Nadie mira a quien sirve el te. Ella conto con eso toda la noche.',         '#10b981', 3),
  ('d', 'Personaje D', 'El inspector',     'Llego demasiado rapido para alguien a quien nadie habia llamado todavia.',  '#3b82f6', 4)
on conflict (id) do nothing;
