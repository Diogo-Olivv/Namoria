# SPEC — App de Álbuns (Fotos + Vídeos) — v2

## 1. Visão Geral
Web app **mobile-first** para casal armazenar/organizar **fotos e vídeos**. Custo ≈ zero via armazenamento em duas vias no Cloudflare R2 (**Hot `/web`** + **Cold `/vault`**). Carregamento rápido no celular + backup original em alta resolução. Acesso privado (2 usuários).

## 2. Stack
* **Frontend:** Next.js 14+ (App Router) + TypeScript
* **Estilo:** Tailwind CSS (mobile-first)
* **UI:** Swiper.js (viewer fullscreen touch) + Masonry (`react-masonry-css` ou CSS columns)
* **Backend/DB/Auth:** Supabase (PostgreSQL + Auth + RLS)
* **Storage:** Cloudflare R2 (S3-compatible) via `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner`
* **Compressão imagem:** `browser-image-compression` (ou Canvas manual)
* **Poster vídeo:** frame extraído via `<video>` + Canvas
* **Deploy:** Vercel (free tier)

## 3. Arquitetura de Armazenamento
Bucket R2, duas ramificações:
| Prefixo | Conteúdo | Uso |
| :-- | :-- | :-- |
| `/web` | Imagens WebP (max 1440px) + posters de vídeo (WebP) | Servido na UI (thumb/grid) |
| `/vault` | Originais brutos: foto (JPEG/RAW) **e vídeo (MP4/MOV)** | Backup + playback (vídeo) + download |

**Privacidade:** bucket NÃO público. DB guarda só a **object key**. URLs de exibição/playback/download geradas sob demanda como **presigned GET** (TTL curto), após checagem de sessão Supabase.

### 3.1. Fluxo de Upload — Imagem
1. Usuário seleciona foto original (ex: 5MB).
2. Frontend gera `.webp` via Canvas/compressor (ex: 150KB, max 1440px).
3. API `/api/upload/presign` → devolve presigned **PUT** para `/web` e `/vault` + keys.
4. Uploads **paralelos** direto ao R2 (browser → R2).
5. Frontend chama API insert → grava row em `media` (`type='image'`).

### 3.2. Fluxo de Upload — Vídeo
1. Usuário seleciona vídeo (ex: MP4 do celular).
2. Frontend carrega em `<video>` oculto → captura frame (ex: t=1s) → Canvas → **poster `.webp`** (max 1440px).
3. API presign → PUT do poster (`/web`) + PUT do vídeo original (`/vault`).
4. Uploads paralelos. **Sem transcodificação** (MVP): serve o MP4 original com HTTP Range.
5. Insert row `media` (`type='video'`, guarda `duration`, `width`, `height`).

> Transcodificação de vídeo (ffmpeg.wasm p/ versão web leve) = **fora de escopo do MVP** (pesado no browser). Vídeos de celular já vêm H.264/MP4 — playback direto via Range é aceitável.

### 3.3. Servir Mídia (leitura)
* Grid usa `display_key` → presigned GET (imagem webp OU poster do vídeo).
* Viewer:
  * imagem → presigned GET de `display_key` (e "Baixar Original" → `original_key`).
  * vídeo → `<video src>` = presigned GET de `original_key` (streaming Range).
* Endpoint batch `/api/media/sign` recebe lista de keys → retorna URLs assinadas (TTL ~1h).

## 4. Modelo de Dados (Supabase / PostgreSQL)

### `albums`
| Coluna | Tipo | Nota |
| :-- | :-- | :-- |
| `id` | uuid PK | `gen_random_uuid()` |
| `title` | varchar | not null |
| `description` | text | |
| `cover_key` | varchar | key `/web` da capa |
| `created_at` | timestamptz | `now()` |

### `media` (fotos + vídeos unificados)
| Coluna | Tipo | Nota |
| :-- | :-- | :-- |
| `id` | uuid PK | |
| `album_id` | uuid FK | → `albums.id` ON DELETE CASCADE |
| `type` | varchar | `'image'` \| `'video'` |
| `display_key` | varchar | `/web`: thumb (foto) ou poster (vídeo) |
| `original_key` | varchar | `/vault`: original bruto (foto/vídeo) |
| `width` | int | px |
| `height` | int | px (usado p/ Masonry aspect-ratio) |
| `duration` | numeric | seg (só vídeo) |
| `mime_type` | varchar | |
| `file_size` | bigint | bytes |
| `created_at` | timestamptz | `now()` |

**SQL** (rodar no Supabase SQL Editor):
```sql
create extension if not exists "pgcrypto";

create table public.albums (
  id uuid primary key default gen_random_uuid(),
  title varchar not null,
  description text,
  cover_key varchar,
  created_at timestamptz not null default now()
);

create table public.media (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.albums(id) on delete cascade,
  type varchar not null default 'image' check (type in ('image','video')),
  display_key varchar not null,
  original_key varchar not null,
  width int,
  height int,
  duration numeric,
  mime_type varchar,
  file_size bigint,
  created_at timestamptz not null default now()
);
create index media_album_id_idx on public.media(album_id);

alter table public.albums enable row level security;
alter table public.media  enable row level security;

create policy "auth all albums" on public.albums
  for all to authenticated using (true) with check (true);
create policy "auth all media" on public.media
  for all to authenticated using (true) with check (true);
```

## 5. UI/UX
* **Home:** cards grandes, borda arredondada. Capa cobre fundo do card + gradiente escuro na base → `title`/`description` em branco.
* **Álbum:** **Masonry**, preserva aspect-ratio (usa `width`/`height`, sem corte). Vídeos = poster + ícone play + badge duração.
* **Viewer individual:** modal fullscreen escuro + **Swiper.js** (swipe lateral). Imagem estática; vídeo com `<video controls playsInline>`.
* **Ações:** botão "Baixar Original" → presigned GET de `original_key`.
* **Upload:** botão flutuante; aceita múltiplos arquivos; barra de progresso; detecta image/* vs video/*.
* **Segurança:** rotas protegidas por sessão Supabase; RLS só `authenticated`; signup público **desabilitado** (2 contas criadas manualmente).

## 6. Endpoints (Next.js Route Handlers)
| Rota | Método | Função |
| :-- | :-- | :-- |
| `/api/upload/presign` | POST | valida sessão → gera presigned PUT p/ keys `/web` e `/vault` |
| `/api/media` | POST | insere row em `media` após upload |
| `/api/media/sign` | POST | recebe keys → retorna presigned GET (TTL ~1h) |
| `/api/albums` | GET/POST | lista/cria álbuns |

Server usa `@supabase/ssr` p/ ler sessão; R2 client com credenciais em **env server-side** (nunca expostas ao browser).

## 7. Variáveis de Ambiente
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server only
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=                 # server only
R2_SECRET_ACCESS_KEY=             # server only
R2_BUCKET_NAME=
R2_ENDPOINT=                      # https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

## 8. Próximos Passos (dev)
1. Scaffold Next.js + Tailwind + libs.
2. Cliente Supabase (browser + server via `@supabase/ssr`) + middleware de auth.
3. Cliente R2 (S3) + helpers presign PUT/GET.
4. Hooks: `useImageCompress` (Canvas→webp) + `useVideoPoster` (video→canvas→webp).
5. Fluxo upload (imagem + vídeo).
6. UI Home (cards) + Álbum (Masonry) + Viewer (Swiper).
7. RLS + proteção de rotas.
8. Deploy Vercel.
