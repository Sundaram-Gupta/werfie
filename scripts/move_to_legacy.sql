CREATE SCHEMA IF NOT EXISTS legacy;
DO $$ 
DECLARE 
    r RECORD; 
BEGIN 
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP 
        EXECUTE 'ALTER TABLE public."' || r.tablename || '" SET SCHEMA legacy'; 
    END LOOP; 

    FOR r IN (SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE n.nspname = 'public' AND c.relkind = 'S') LOOP
        EXECUTE 'ALTER SEQUENCE public."' || r.relname || '" SET SCHEMA legacy';
    END LOOP;

    FOR r IN (SELECT typname FROM pg_type t JOIN pg_namespace n ON n.oid = t.typnamespace WHERE n.nspname = 'public' AND t.typtype = 'e') LOOP
        EXECUTE 'ALTER TYPE public."' || r.typname || '" SET SCHEMA legacy';
    END LOOP;
END $$;
