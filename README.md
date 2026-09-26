# Meu Visionboard

Aplicação pessoal de visionboard, em português brasileiro, feita com React, TypeScript, Vite, Supabase e preparada como PWA para desktop e celular. Os dados e imagens são privados por padrão. Pexels e geração por IA não fazem parte desta primeira fase.

## Rodar localmente

1. Instale Node.js 22.6 ou superior.
2. Copie `.env.example` para `.env.local`.
3. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com os valores públicos do seu projeto Supabase. Nunca coloque `service_role` no navegador.
4. Instale dependências com `pnpm install` (ou `corepack pnpm install`).
5. Execute `npm run dev` e abra o endereço mostrado no terminal.
6. Para gerar a versão de produção, execute `npm run build`; a saída fica em `dist/`.

Sem Supabase configurado, a tela de acesso indica que falta configurar o serviço e não cria dados fictícios.

## Supabase: banco e Storage

1. Crie um projeto Supabase e copie URL e chave pública para `.env.local`.
2. Para executar pelo SQL Editor, cole o conteúdo de `supabase/migrations/202609260001_initial_schema.sql`. Para usar a CLI, execute `supabase login`, `supabase link --project-ref <project-ref>` e depois `supabase db push`.
3. A migration cria as tabelas, índices, trigger de perfil, integridade entre entidades, regras de conclusão, RLS em todas as tabelas e o bucket privado `visionboard-private`.
4. O bucket limita os arquivos a 10 MB e aceita JPEG, PNG e WebP. As políticas exigem que a primeira pasta do caminho seja o UUID do usuário autenticado. Caminhos de metas são `{user_id}/goals/{goal_id}/{arquivo}`.
5. Confirme em Storage que o bucket permanece privado; não crie políticas públicas.

RLS usa `auth.uid()` e chaves estrangeiras compostas para impedir associar uma meta/frase/imagem de outra conta, inclusive em operações diretas na API. Mantenha migrations versionadas. Para confirmar isolamento com dois usuários, use dois logins e tente ler, alterar e excluir os IDs cruzados pela API autenticada: as linhas de terceiros não devem ser retornadas ou modificadas. A verificação automatizada contra dois usuários ainda precisa de um projeto de teste Supabase.

## Google OAuth

1. No Google Cloud Console, configure a tela de consentimento OAuth e crie uma credencial OAuth 2.0 do tipo Aplicativo da Web.
2. Em Supabase → Authentication → Providers → Google, habilite Google e informe Client ID e Client Secret do Google (estes segredos ficam apenas no Supabase).
3. Copie a URI de callback exibida pelo Supabase, no formato `https://<project-ref>.supabase.co/auth/v1/callback`, para “URIs de redirecionamento autorizados” da credencial no Google.
4. Em Supabase → Authentication → URL Configuration, cadastre como Site URL seu endereço de produção Netlify, por exemplo `https://seu-app.netlify.app`.
5. Adicione `http://localhost:5173` e a URL de produção em Redirect URLs do Supabase. Para preview, adicione a URL específica `https://<deploy-preview>--<site>.netlify.app` ou use um padrão de preview restrito.
6. O app retorna para a origem atual após OAuth; não use curingas amplos em produção.

## Netlify

1. Importe `nalifazarte/visionboard` como site. O `netlify.toml` define `pnpm build`, publicação de `dist` e fallback da aplicação.
2. Em Site configuration → Environment variables, cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` para os contextos de produção e deploy preview. São credenciais públicas com RLS como fronteira de segurança; nenhuma chave privada de serviço deve estar no build.
3. Atualize as URLs Site URL/Redirect URLs no Supabase. Em “Origens JavaScript autorizadas” no Google, cadastre `http://localhost:5173` e o domínio do Netlify; adicione previews apenas se for usá-los.
4. Deploy automático é feito a cada push para a branch principal.

## Estrutura

- `src/App.tsx`: telas, navegação responsiva, autenticação, operações das metas/frases e upload.
- `src/lib/domain.ts`: regras puras para prazo, progresso, status, trimestre e validação de imagem.
- `src/lib/supabase.ts`: cliente Supabase usando apenas variáveis públicas.
- `supabase/migrations/`: schema, integridade, RLS, bucket e políticas.
- `public/`: ícone e favicon do PWA.

## O que está implementado nesta base

Login Google, rotas de conteúdo atrás da sessão, dashboard, mural anual/trimestres, CRUD de metas e frases, upload de imagens, progresso/status/prazo, escolha de capa no upload, ordenação manual por arrastar, tema claro/escuro pelo sistema e manifesto instalável. Os signed URLs de capa expiram após uma hora e são recriados ao carregar o mural.

Pexels e wallpapers gerados por IA ficam para a próxima fase. As imagens próprias já podem ser enviadas, escolhidas como capa, ordenadas e removidas. Wallpapers têm apenas o schema preparado (`generation_mode` aceita `collage` ou `artistic`), sem geração ativa.

## Validação

`npm test` cobre regras de progresso, conclusão, atraso, trimestre e upload com o test runner nativo do Node.js. `npm run build` valida tipos e empacotamento. Um build local não valida credenciais, URLs de OAuth ou políticas em uma instância Supabase; complete a verificação com as contas de teste antes do uso real.





