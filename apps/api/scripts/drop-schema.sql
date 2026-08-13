-- Drop the entire public schema (all tables, indexes, constraints, sequences)
-- and recreate it empty. This is used to fully reset the Neon database.
DROP SCHEMA IF EXISTS public CASCADE;
CREATE SCHEMA public;
