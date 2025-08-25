-- Team Admin — Organização (CFG-ORG-P1)
alter table if exists public.tenants
  add column if not exists display_name text,
  add column if not exists legal_name   text,
  add column if not exists cnpj         text,
  add column if not exists address      jsonb,
  add column if not exists timezone     text default 'America/Sao_Paulo',
  add column if not exists currency     char(3) default 'BRL',
  add column if not exists plan_code    text check (plan_code in ('basic','enterprise')) default 'basic';


