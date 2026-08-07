-- Migração 002 — nome e data por mídia (para lembrar os momentos)
-- Rode no Supabase SQL Editor.

alter table public.media
  add column if not exists title varchar,
  add column if not exists taken_at timestamptz;

-- Data do momento: usa a data de criação como padrão para linhas existentes.
update public.media set taken_at = created_at where taken_at is null;

-- Ordenação por data do momento dentro do álbum.
create index if not exists media_album_taken_idx
  on public.media (album_id, taken_at desc);
