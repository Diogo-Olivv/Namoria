# SETUP — configuração manual (só humano)

O código está pronto, mas o app depende de serviços externos que **você** precisa
criar/configurar. Nada aqui pode (nem deve) ser feito pelo agente.

## 1. Supabase

1. Crie um projeto em https://supabase.com.
2. **SQL Editor** → rode o schema + RLS da seção 4 do `SPEC.md` (tabelas `albums`,
   `media`, índices e policies `authenticated`).
   - Depois rode a migração **`sql/002_media_title_takenat.sql`** (adiciona
     `title` e `taken_at` em `media`, usados para nome e data de cada foto).
3. **Authentication → Providers → Email**: mantenha ativo, mas
   **Authentication → Sign In / Providers → "Allow new users to sign up" = OFF**
   (signup público desabilitado — só 2 contas manuais).
4. **Authentication → Users → Add user** (x2): crie as duas contas do casal
   (email + senha). Confirme o email (ou marque como confirmado).
5. Copie de **Project Settings → API**:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key (⚠️ só server)

## 2. Cloudflare R2

1. Crie um bucket (ex: `namoria`). **Não** torne público.
2. **Manage R2 API Tokens** → crie um token com permissão de Object Read & Write.
   Anote:
   - `R2_ACCESS_KEY_ID`
   - `R2_SECRET_ACCESS_KEY`
   - `R2_ACCOUNT_ID` (ID da conta)
   - `R2_BUCKET_NAME` (nome do bucket)
   - `R2_ENDPOINT` = `https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com`
3. **CORS** (obrigatório — o browser faz PUT direto e o `<video>` usa Range GET).
   Bucket → Settings → CORS Policy:

   ```json
   [
     {
       "AllowedOrigins": [
         "http://localhost:3000",
         "https://SEU-APP.vercel.app"
       ],
       "AllowedMethods": ["GET", "PUT"],
       "AllowedHeaders": ["*"],
       "ExposeHeaders": ["ETag", "Content-Length", "Content-Range", "Accept-Ranges"],
       "MaxAgeSeconds": 3600
     }
   ]
   ```

   > Sem `Content-Range`/`Accept-Ranges` expostos o seek de vídeo pode falhar.
   > Ajuste `AllowedOrigins` para o domínio real de produção.

## 3. Ambiente local

1. `cp .env.example .env.local` e preencha **todas** as variáveis acima.
2. `npm run dev` → http://localhost:3000 (redireciona para `/login`).

Se faltar alguma env **server** (R2 / service role), as rotas retornam erro
explícito ("Missing required environment variable: …") — por design.

## 4. Deploy (Vercel)

1. Importe o repositório na Vercel.
2. **Project Settings → Environment Variables**: adicione as 8 variáveis do
   `.env.example` (as `NEXT_PUBLIC_*` e as server-only).
3. Deploy. Depois **adicione a URL de produção ao CORS do R2** (passo 2.3).

## Checklist do que só você consegue fazer

- [ ] Projeto Supabase criado + SQL do SPEC rodado
- [ ] Signup público desativado
- [ ] 2 usuários criados manualmente
- [ ] Bucket R2 criado (privado) + token de API
- [ ] CORS do R2 configurado (localhost + produção)
- [ ] `.env.local` preenchido
- [ ] Envs configuradas na Vercel
