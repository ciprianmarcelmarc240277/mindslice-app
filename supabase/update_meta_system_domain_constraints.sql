do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'mindslice_memory_states'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%domain%'
      and pg_get_constraintdef(con.oid) ilike '%narrative%'
      and pg_get_constraintdef(con.oid) ilike '%art%'
      and pg_get_constraintdef(con.oid) ilike '%structure%'
      and pg_get_constraintdef(con.oid) ilike '%color%'
      and pg_get_constraintdef(con.oid) ilike '%shape%'
      and pg_get_constraintdef(con.oid) ilike '%shape_grammar%'
  loop
    execute format(
      'alter table public.mindslice_memory_states drop constraint %I',
      constraint_name
    );
  end loop;

  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'mindslice_memory_states'
      and con.conname = 'mindslice_memory_states_domain_check'
  ) then
    alter table public.mindslice_memory_states
      add constraint mindslice_memory_states_domain_check
      check (domain in ('narrative', 'art', 'structure', 'color', 'shape', 'shape_grammar', 'meta_system'));
  end if;
end
$$;

do $$
declare
  constraint_name text;
begin
  for constraint_name in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'mindslice_canon_states'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%domain%'
      and pg_get_constraintdef(con.oid) ilike '%narrative%'
      and pg_get_constraintdef(con.oid) ilike '%art%'
      and pg_get_constraintdef(con.oid) ilike '%structure%'
      and pg_get_constraintdef(con.oid) ilike '%color%'
      and pg_get_constraintdef(con.oid) ilike '%shape%'
      and pg_get_constraintdef(con.oid) ilike '%shape_grammar%'
  loop
    execute format(
      'alter table public.mindslice_canon_states drop constraint %I',
      constraint_name
    );
  end loop;

  if not exists (
    select 1
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'mindslice_canon_states'
      and con.conname = 'mindslice_canon_states_domain_check'
  ) then
    alter table public.mindslice_canon_states
      add constraint mindslice_canon_states_domain_check
      check (domain in ('narrative', 'art', 'structure', 'color', 'shape', 'shape_grammar', 'meta_system'));
  end if;
end
$$;
