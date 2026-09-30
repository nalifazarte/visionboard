# Meu Visionboard

Aplicativo pessoal de visionboard em português brasileiro, feito com React, TypeScript, Vite e Supabase. O site é publicado pelo GitHub Pages; dados e imagens ficam no Supabase e são privados por usuário.

## Como usar

Abra [nalifazarte.github.io/visionboard](https://nalifazarte.github.io/visionboard/) e entre com Google. Use a mesma conta no computador e no celular para acessar os dados sincronizados.

## Privacidade

O site é público, mas cada pessoa só pode acessar os próprios dados. O banco usa políticas RLS e o bucket de imagens é privado. Não é criptografia ponta a ponta: o Supabase hospeda o banco e os arquivos.

`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` são chaves públicas usadas pelo navegador. A proteção dos dados depende das políticas RLS e do Storage incluídas nas migrations. Nunca coloque chaves `service_role`/secret em nomes `VITE_`, no frontend ou no GitHub Pages.

## Recursos e pastas

- `src/App.tsx`: interface, login, metas duplicáveis e removíveis, frases, imagens, wallpapers, aparência e instalação.
- `src/lib/domain.ts`: regras de status, progresso, prazos, imagens e categorias predefinidas.
- `src/lib/supabase.ts`: conexão com Supabase usando somente variáveis públicas.
- `supabase/migrations/`: esquema do banco, RLS, Storage privado e migrações versionadas.
- `supabase/functions/`: exclusão segura de conta.
- `.github/workflows/deploy.yml`: compilação e publicação automática no GitHub Pages.

O PWA funciona em computador e celular. Wallpapers são montados no navegador a partir das imagens de capa e frases escolhidas, salvos no Storage privado e baixados em PNG. A composição não usa IA nem envia as fotos para outro provedor. A pesquisa no Pexels foi removida; adicione imagens às metas pelo upload.

## Ativar categorias de metas

Antes de atualizar o site, aplique a migration `supabase/migrations/202609300001_goal_tags.sql` no Supabase:

1. No painel do Supabase, abra **SQL Editor → New query**.
2. No GitHub, abra esse arquivo de migration, clique em **Raw** e copie o SQL completo.
3. Cole no editor do Supabase e clique em **Run**.

A migration acrescenta categorias às metas existentes, com uma lista permitida e índice. Metas já salvas recebem uma lista vazia; nenhum dado existente é apagado. Depois, publique a atualização do site pelo GitHub Pages.

## Publicar a exclusão de conta

A exclusão segura da conta usa uma Supabase Edge Function. Se você ainda não a publicou, no computador, dentro da pasta do projeto (a que contém `package.json`), abra o PowerShell e siga estes passos:

1. `npx supabase login` — autorize o CLI pelo navegador.
2. `npx supabase link --project-ref SEU_PROJECT_REF` — troque o texto pelo trecho do Project URL antes de `.supabase.co`.
3. `npx supabase functions deploy delete-account` — publique a função.

Não é necessário configurar chave do Pexels. Se você já executou a migration `202609280001_pexels_images.sql`, deixe-a como está: não apague nem reverta dados ou migrations já aplicadas. O app simplesmente não chama mais a função de busca.
## Aparência e instalação

A escolha entre tema claro e escuro fica salva no dispositivo. Para instalar:

- **Android:** abra o site no Chrome e escolha **Instalar app** ou **Adicionar à tela inicial**. Se necessário, use o menu `⋮`.
- **iPhone/iPad:** abra no Safari e toque em **Compartilhar → Adicionar à Tela de Início → Adicionar**.
- **Computador:** use **Instalar app** na barra de endereço ou no menu quando seu navegador oferecer essa opção.

## Desenvolvimento e validação

Copie `.env.example` para `.env.local`, configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, e deixe `VITE_BASE_PATH=/`. Com Node.js 22.6+ e pnpm instalados, execute `pnpm install`, `pnpm dev` e abra `http://localhost:5173/`.

`pnpm test` roda testes de regras e segurança do schema. `pnpm build` valida e compila a aplicação. Credenciais reais, OAuth e isolamento devem ser conferidos no projeto Supabase configurado.

