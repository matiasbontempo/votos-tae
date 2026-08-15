-- Simula lo que Supabase ya trae hecho, para poder correr schema.sql tal cual.
create role anon nologin;
create role authenticated nologin;
create publication supabase_realtime;
