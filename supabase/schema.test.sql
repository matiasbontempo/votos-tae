\set ON_ERROR_STOP on
\pset pager off

create or replace function check_eq(label text, got anyelement, want anyelement)
returns void language plpgsql as $$
begin
  if got is not distinct from want then
    raise notice 'PASS  % (=%)', label, got;
  else
    raise exception 'FAIL  %: got %, want %', label, got, want;
  end if;
end $$;

-- ===========================================================================
-- 1. Crear funcion siembra las 4 opciones en 0
-- ===========================================================================
insert into shows (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Test 1');

select check_eq('tallies sembradas', (select count(*)::int from tallies
  where show_id='11111111-1111-1111-1111-111111111111'), 4);
select check_eq('arrancan en cero', (select sum(count)::int from tallies
  where show_id='11111111-1111-1111-1111-111111111111'), 0);

-- ===========================================================================
-- 2. Una sola funcion viva a la vez
-- ===========================================================================
do $$
begin
  insert into shows (name) values ('Test 2 - deberia fallar');
  raise exception 'FAIL  se permitio una segunda funcion viva';
exception when unique_violation then
  raise notice 'PASS  segunda funcion viva rechazada';
end $$;

-- ===========================================================================
-- 3. Votos incrementan el conteo
-- ===========================================================================
update shows set status='open' where id='11111111-1111-1111-1111-111111111111';

insert into votes (show_id, option_id, device_id) values
  ('11111111-1111-1111-1111-111111111111','a','dev-1'),
  ('11111111-1111-1111-1111-111111111111','a','dev-2'),
  ('11111111-1111-1111-1111-111111111111','b','dev-3');

select check_eq('conteo opcion a', (select count from tallies
  where show_id='11111111-1111-1111-1111-111111111111' and option_id='a'), 2);
select check_eq('conteo opcion b', (select count from tallies
  where show_id='11111111-1111-1111-1111-111111111111' and option_id='b'), 1);
select check_eq('conteo opcion c', (select count from tallies
  where show_id='11111111-1111-1111-1111-111111111111' and option_id='c'), 0);

-- ===========================================================================
-- 4. Un voto por dispositivo por funcion
-- ===========================================================================
do $$
begin
  insert into votes (show_id, option_id, device_id)
    values ('11111111-1111-1111-1111-111111111111','c','dev-1');
  raise exception 'FAIL  se permitio doble voto del mismo dispositivo';
exception when unique_violation then
  raise notice 'PASS  doble voto rechazado';
end $$;

select check_eq('el doble voto no movio nada', (select sum(count)::int from tallies
  where show_id='11111111-1111-1111-1111-111111111111'), 3);

-- ===========================================================================
-- 5. Borrar votos descuenta (reset de ensayo)
-- ===========================================================================
delete from votes where show_id='11111111-1111-1111-1111-111111111111';
select check_eq('reset deja todo en cero', (select sum(count)::int from tallies
  where show_id='11111111-1111-1111-1111-111111111111'), 0);

-- ===========================================================================
-- 6. RLS sobre tallies segun visibilidad
-- ===========================================================================
insert into votes (show_id, option_id, device_id)
  values ('11111111-1111-1111-1111-111111111111','a','dev-9');

-- hidden -> el publico no ve nada
update shows set status='open', results_visibility='hidden'
  where id='11111111-1111-1111-1111-111111111111';
set role anon;
select check_eq('anon NO ve tallies en hidden', (select count(*)::int from tallies), 0);
reset role;

-- live -> el publico ve
update shows set results_visibility='live'
  where id='11111111-1111-1111-1111-111111111111';
set role anon;
select check_eq('anon ve tallies en live', (select count(*)::int from tallies), 4);
reset role;

-- after_vote -> legible (documentado como barrera de UI, no criptografica)
update shows set results_visibility='after_vote'
  where id='11111111-1111-1111-1111-111111111111';
set role anon;
select check_eq('anon ve tallies en after_vote', (select count(*)::int from tallies), 4);
reset role;

-- cerrada -> siempre visible, aunque estuviera en hidden
update shows set status='closed', results_visibility='hidden'
  where id='11111111-1111-1111-1111-111111111111';
set role anon;
select check_eq('anon ve tallies al cerrar', (select count(*)::int from tallies), 4);

-- ===========================================================================
-- 7. anon nunca ve votos individuales
-- ===========================================================================
do $$
begin
  perform count(*) from votes;
  raise exception 'FAIL  anon pudo leer la tabla votes';
exception when insufficient_privilege then
  raise notice 'PASS  anon sin acceso a votes';
end $$;

do $$
begin
  insert into votes (show_id, option_id, device_id)
    values ('11111111-1111-1111-1111-111111111111','d','hacker');
  raise exception 'FAIL  anon pudo insertar un voto';
exception when insufficient_privilege then
  raise notice 'PASS  anon no puede insertar votos';
end $$;

select check_eq('anon ve las opciones', (select count(*)::int from options), 4);
select check_eq('anon ve la funcion', (select count(*)::int from shows), 1);
reset role;

-- ===========================================================================
-- 8. Finalizar libera el lugar para la proxima funcion
-- ===========================================================================
update shows set status='finished' where id='11111111-1111-1111-1111-111111111111';
insert into shows (id, name) values
  ('22222222-2222-2222-2222-222222222222', 'Test 2');
select check_eq('nueva funcion tras finalizar', (select count(*)::int from shows), 2);
select check_eq('la nueva arranca limpia', (select sum(count)::int from tallies
  where show_id='22222222-2222-2222-2222-222222222222'), 0);
select check_eq('la vieja conserva sus votos', (select sum(count)::int from tallies
  where show_id='11111111-1111-1111-1111-111111111111'), 1);

-- ===========================================================================
-- 9. Borrar una funcion se lleva sus votos y conteos
-- ===========================================================================
delete from shows where id='22222222-2222-2222-2222-222222222222';
select check_eq('cascade limpia tallies', (select count(*)::int from tallies
  where show_id='22222222-2222-2222-2222-222222222222'), 0);

select 'TODOS LOS TESTS PASARON' as resultado;
