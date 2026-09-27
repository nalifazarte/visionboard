# Meu Visionboard

Aplicação pessoal de visionboard em português brasileiro, feita com React, TypeScript, Vite e Supabase. O site será publicado pelo GitHub Pages e os dados e imagens ficam no Supabase, privados por usuário.

## Como usar

Depois da configuração inicial abaixo, basta abrir [https://nalifazarte.github.io/visionboard/](https://nalifazarte.github.io/visionboard/) e entrar com Google. O mesmo endereço funciona no computador e celular; entre com a mesma conta Google para ver seus dados. No celular, use “Adicionar à tela inicial” para instalar o PWA.

## Configuração inicial — passo a passo

### 1. Criar e preparar o Supabase

1. Crie uma conta em [supabase.com](https://supabase.com/) e escolha **New project**. Guarde a senha do banco em local seguro.
2. Aguarde o projeto ficar pronto. No painel do Supabase, abra **SQL Editor** e escolha **New query**.
3. Abra a migration [`supabase/migrations/202609260001_initial_schema.sql`](supabase/migrations/202609260001_initial_schema.sql) neste repositório, copie todo o conteúdo e cole no editor SQL. Clique **Run** e confira se terminou sem erros.
4. No painel, abra **Project Settings → API** e copie o **Project URL** e a chave pública **anon** (ou **publishable**, conforme o painel mostrar). Você vai cadastrá-las no GitHub no passo 4.

A migration cria as tabelas, ativa Row Level Security (RLS), cria regras para cada usuário acessar apenas seus registros e cria o bucket privado `visionboard-private` para imagens. Não torne esse bucket público. Não use nem compartilhe a chave `service_role`/secret.

### 2. Configurar o login pelo Google

1. Abra o [Google Cloud Console](https://console.cloud.google.com/) e crie ou selecione um projeto.
2. Abra **Google Auth Platform** e configure as informações/apresentação do app. Se o app ficar em modo de teste, adicione seu próprio endereço Gmail como usuário de teste.
3. Em **Clients**, crie um cliente OAuth do tipo **Web application**.
4. Em **Authorized JavaScript origins**, adicione exatamente:
   - `https://nalifazarte.github.io`
   - `http://localhost:5173` (somente para testes locais)
5. Deixe a página aberta. No Supabase, abra **Authentication → Providers → Google** e habilite Google. Copie o **Client ID** e o **Client Secret** do Google para os campos do Supabase.
6. Na página do provedor Google do Supabase, copie o callback que aparece. Ele tem este formato: `https://SEU-PROJECT-REF.supabase.co/auth/v1/callback`.
7. Volte ao Google Cloud Console e adicione esse endereço em **Authorized redirect URIs**. É o endereço do Supabase, não o do GitHub Pages. Salve.

### 3. Cadastrar os endereços de retorno no Supabase

No Supabase, abra **Authentication → URL Configuration** e configure:

- **Site URL**: `https://nalifazarte.github.io/visionboard/`
- **Redirect URLs**: adicione `https://nalifazarte.github.io/visionboard/`
- Para testar localmente, adicione também `http://localhost:5173/`

Salve. O app retorna para o endereço atual do mural depois do login; a URL precisa estar autorizada aqui. Não adicione curingas amplos. [Documentação sobre URLs de retorno](https://supabase.com/docs/guides/auth/redirect-urls)

### 4. Cadastrar a conexão segura no GitHub

1. Abra o repositório [nalifazarte/visionboard](https://github.com/nalifazarte/visionboard).
2. Vá a **Settings → Secrets and variables → Actions → Variables**.
3. Clique **New repository variable** e cadastre estas duas variáveis com os valores copiados do Supabase:
   - Nome `VITE_SUPABASE_URL` → valor do **Project URL**.
   - Nome `VITE_SUPABASE_ANON_KEY` → valor da chave pública **anon** ou **publishable**.
4. Cadastre-as como **Variables** do repositório. São valores públicos de frontend; não cadastre uma `service_role`/secret key. Nunca coloque segredos privados em nomes `VITE_` ou no código.

### 5. Ativar e publicar o GitHub Pages

1. No repositório, abra **Settings → Pages**.
2. Em **Build and deployment → Source**, escolha **GitHub Actions**.
3. Abra a aba **Actions**. O workflow **Publicar no GitHub Pages** compila o app e publica os arquivos. Se a primeira execução tiver ocorrido antes de ativar Pages, abra o workflow e clique **Run workflow** depois de ativá-lo.
4. Aguarde a execução ficar verde. Abra [https://nalifazarte.github.io/visionboard/](https://nalifazarte.github.io/visionboard/).
5. Faça login com Google, crie uma meta e envie uma imagem para confirmar que banco e Storage estão ligados. Depois abra o mesmo site em outro dispositivo e entre com a mesma conta.

A cada atualização publicada na branch `main`, o GitHub Actions recompila e publica o app. O arquivo [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) define esse processo.

## Privacidade e chaves

O endereço do site e o código frontend podem ser vistos por quem abrir a página. Os dados pessoais continuam privados pelo Supabase: as políticas RLS controlam o acesso às tabelas e as políticas do Storage restringem arquivos à pasta do usuário autenticado. Isso não é criptografia ponta a ponta: o Supabase hospeda o banco e as imagens.

`VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` são valores públicos que acabam disponíveis no navegador. A segurança depende de RLS e das políticas do bucket, já incluídas na migration. **Nunca** use a chave `service_role`/secret no frontend, em variáveis `VITE_`, no GitHub Pages ou no repositório.

## Teste local opcional

1. Copie `.env.example` para `.env.local`.
2. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` com os valores públicos do Supabase. Deixe `VITE_BASE_PATH=/`.
3. Instale Node.js 22.6+, depois execute `pnpm install` e `pnpm dev`. Abra `http://localhost:5173/`.
4. No Google Cloud Console e no Supabase, mantenha também os endereços locais descritos acima enquanto estiver desenvolvendo.

## O que está incluído

- `src/App.tsx`: interface responsiva, login, metas, frases e uploads.
- `src/lib/domain.ts`: regras para status, progresso, prazo e imagens.
- `src/lib/supabase.ts`: cliente Supabase com valores públicos.
- `supabase/migrations/`: banco, RLS e Storage privado.
- `.github/workflows/deploy.yml`: compilação e publicação automática no GitHub Pages.

O mural anual, trimestres, metas, prazos, frases e uploads estão implementados. O PWA instala como app no celular e no computador. Pexels e geração de wallpapers por IA não fazem parte desta fase.

## Validação

`pnpm test` executa os testes de regras e verificações do schema/políticas. `pnpm build` compila o aplicativo. O teste local não verifica credenciais reais, configuração OAuth nem isolamento em um projeto Supabase; faça o teste com sua conta após a configuração.
