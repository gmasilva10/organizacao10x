-- Idempotent FKs with ON DELETE CASCADE for student-related data
-- Kanban
alter table if exists public.kanban_items
  add constraint if not exists kanban_items_student_id_fkey
  foreign key (student_id) references public.students(id) on delete cascade;

alter table if exists public.card_tasks
  add constraint if not exists card_tasks_card_id_fkey
  foreign key (card_id) references public.kanban_items(id) on delete cascade;

-- Optional tables (existence may vary)
do $$ begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='kanban_comments') then
    execute 'alter table public.kanban_comments add constraint if not exists kanban_comments_item_id_fkey foreign key (item_id) references public.kanban_items(id) on delete cascade';
  end if;
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='kanban_attachments') then
    execute 'alter table public.kanban_attachments add constraint if not exists kanban_attachments_item_id_fkey foreign key (item_id) references public.kanban_items(id) on delete cascade';
  end if;
end $$;

-- Serviços
alter table if exists public.service_enrollments
  add constraint if not exists service_enrollments_student_id_fkey
  foreign key (student_id) references public.students(id) on delete cascade;

alter table if exists public.service_orders
  add constraint if not exists service_orders_student_id_fkey
  foreign key (student_id) references public.students(id) on delete cascade;

alter table if exists public.service_items
  add constraint if not exists service_items_order_id_fkey
  foreign key (order_id) references public.service_orders(id) on delete cascade;

-- Financeiro
alter table if exists public.invoices
  add constraint if not exists invoices_student_id_fkey
  foreign key (student_id) references public.students(id) on delete cascade;

alter table if exists public.invoice_items
  add constraint if not exists invoice_items_invoice_id_fkey
  foreign key (invoice_id) references public.invoices(id) on delete cascade;

alter table if exists public.payments
  add constraint if not exists payments_invoice_id_fkey
  foreign key (invoice_id) references public.invoices(id) on delete cascade;

-- Relacionamento/Histórico
alter table if exists public.interactions
  add constraint if not exists interactions_student_id_fkey
  foreign key (student_id) references public.students(id) on delete cascade;

alter table if exists public.notes
  add constraint if not exists notes_student_id_fkey
  foreign key (student_id) references public.students(id) on delete cascade;

-- Arquivos
alter table if exists public.uploads
  add constraint if not exists uploads_student_id_fkey
  foreign key (student_id) references public.students(id) on delete cascade;


