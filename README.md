# Meu Visionboard

Aplicativo pessoal de visionboard em português brasileiro, feito com React, TypeScript, Vite e Supabase. O site é publicado pelo GitHub Pages; dados e imagens ficam no Supabase e são privados por usuário.

## Como usar

Abra [nalifazarte.github.io/visionboard](https://nalifazarte.github.io/visionboard/) e entre com Google. Use a mesma conta no computador e no celular para acessar os dados sincronizados.

## Privacidade

O site é público, mas cada pessoa só pode acessar os próprios dados. O banco usa políticas RLS e o bucket de imagens é privado. Não é criptografia ponta a ponta: o Supabase hospeda o banco e os arquivos.

`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` são chaves públicas usadas pelo navegador. A proteção dos dados depende das políticas RLS e do Storage incluídas nas migrations. Nunca coloque chaves `service_role`/secret em nomes `VITE_`, no frontend ou no GitHub Pages.

## Recursos e pastas

- `src/App.tsx`: interface, login, metas duplicáveis, frases favoritas, imagens, aparência e instalação.
- `src/lib/domain.ts`: regras de status, progresso, prazos e imagens.
- `src/lib/supabase.ts`: conexão com Supabase usando somente variáveis públicas.
- `supabase/migrations/`: esquema do banco, RLS, Storage privado e metadados Pexels.
- `supabase/functions/`: busca Pexels e exclusão segura de conta.
- `.github/workflows/deploy.yml`: compilação e publicação automática no GitHub Pages.

O PWA funciona em computador e celular. IA para geração de wallpapers não está incluída nesta fase.

## Ativar Pexels e exclusão de conta

Essas duas funções são opcionais e precisam ser publicadas no Supabase. Não é necessário configurar isso para abrir o app, entrar ou usar imagens próprias.

1. No painel Supabase, abra **SQL Editor → New query** e execute o arquivo `supabase/migrations/202609280001_pexels_images.sql` deste repositório.
2. Instale a [CLI do Supabase](https://supabase.com/docs/guides/cli), entre (`supabase login`) e vincule este projeto (`supabase link --project-ref SEU_PROJECT_REF`). O project ref aparece no endereço do projeto no painel.
3. No terminal, na pasta do projeto, publique a exclusão segura com `supabase functions deploy delete-account`. O servidor Supabase fornece as chaves privadas necessárias; não as copie para o site ou GitHub.
4. Para buscar imagens, gere uma chave na [API do Pexels](https://www.pexels.com/api/) e cadastre como segredo: `supabase secrets set PEXELS_API_KEY=sua_chave`.
5. Publique a busca/importação Pexels com `supabase functions deploy pexels`.

O app valida o login antes das operações. As imagens escolhidas no Pexels são copiadas para o bucket privado do usuário e mantêm créditos do fotógrafo. A chave Pexels fica apenas no servidor. A API do Pinterest não foi conectada.

## Aparência e instalação

A escolha entre tema claro e escuro fica salva no dispositivo. Para instalar:

- **Android:** abra o site no Chrome e escolha **Instalar app** ou **Adicionar à tela inicial**. Se necessário, use o menu `⋮`.
- **iPhone/iPad:** abra no Safari e toque em **Compartilhar → Adicionar à Tela de Início → Adicionar**.
- **Computador:** use **Instalar app** na barra de endereço ou no menu quando seu navegador oferecer essa opção.

## Desenvolvimento e validação

Copie `.env.example` para `.env.local`, configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`, e deixe `VITE_BASE_PATH=/`. Com Node.js 22.6+ e pnpm instalados, execute `pnpm install`, `pnpm dev` e abra `http://localhost:5173/`.

`pnpm test` roda testes de regras e segurança do schema. `pnpm build` valida e compila a aplicação. Credenciais reais, OAuth e isolamento devem ser conferidos no projeto Supabase configurado.