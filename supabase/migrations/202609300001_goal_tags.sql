alter table public.goals
  add column if not exists tags text[] not null default '{}'::text[];

alter table public.goals
  drop constraint if exists goals_tags_allowed;

alter table public.goals
  add constraint goals_tags_allowed check (
    tags <@ array[
      'pessoal', 'profissional', 'saude', 'relacionamentos', 'financas',
      'estudos', 'hobbies', 'familia', 'espiritualidade', 'viagens',
      'autocuidado', 'criatividade', 'comunidade'
    ]::text[]
  );

create index if not exists goals_tags_gin_idx on public.goals using gin(tags);

