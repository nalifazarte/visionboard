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



## Aparência e instalação

A escolha entre tema claro e escuro fica salva no dispositivo. Para instalar:

- **Android:** abra o site no Chrome e escolha **Instalar app** ou **Adicionar à tela inicial**. Se necessário, use o menu `⋮`.
- **iPhone/iPad:** abra no Safari e toque em **Compartilhar → Adicionar à Tela de Início → Adicionar**.
- **Computador:** use **Instalar app** na barra de endereço ou no menu quando seu navegador oferecer essa opção.

