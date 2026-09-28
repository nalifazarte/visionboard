# Meu Visionboard

Aplicação pessoal de visionboard em português brasileiro, feita com React, TypeScript, Vite e Supabase. O site é publicado pelo GitHub Pages e os dados e imagens ficam no Supabase, privados por usuário.

## Como usar

Basta abrir [https://nalifazarte.github.io/visionboard/](https://nalifazarte.github.io/visionboard/) e entrar com Google. O mesmo endereço funciona no computador e celular; entre com a mesma conta Google para ver seus dados. No celular, use “Adicionar à tela inicial” para instalar o PWA.


## Privacidade e chaves

O endereço do site e o código frontend podem ser vistos por quem abrir a página. Os dados pessoais continuam privados pelo Supabase: as políticas RLS controlam o acesso às tabelas e as políticas do Storage restringem arquivos à pasta do usuário autenticado. Isso não é criptografia ponta a ponta: o Supabase hospeda o banco e as imagens.



## O que está incluído

- `src/App.tsx`: interface responsiva, login, metas, frases e uploads.
- `src/lib/domain.ts`: regras para status, progresso, prazo e imagens.
- `src/lib/supabase.ts`: cliente Supabase com valores públicos.
- `supabase/migrations/`: banco, RLS e Storage privado.
- `.github/workflows/deploy.yml`: compilação e publicação automática no GitHub Pages.

O mural anual, trimestres, metas, prazos, frases e uploads estão implementados. O PWA instala como app no celular e no computador. Pexels e geração de wallpapers por IA não fazem parte desta fase.

