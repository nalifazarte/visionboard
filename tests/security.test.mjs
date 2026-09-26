import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
const migration=await readFile(new URL('../supabase/migrations/202609260001_initial_schema.sql',import.meta.url),'utf8')
const app=await readFile(new URL('../src/App.tsx',import.meta.url),'utf8')
const tables=['profiles','vision_boards','goals','goal_images','quotes','wallpapers']
test('RLS está habilitado em todas as tabelas pessoais',()=>{for(const table of tables){assert.match(migration,new RegExp(`alter table public\\.${table} enable row level security`));assert.match(migration,new RegExp(`create policy .* on public\\.${table} for all to authenticated`))}})
test('bucket de imagens é privado, limitado e isolado por pasta do usuário',()=>{assert.match(migration,/values\('visionboard-private','visionboard-private',false,10485760/);assert.match(migration,/storage\.foldername\(name\)\)\[1\]=auth\.uid\(\)::text/);assert.match(migration,/allowed_mime_types=array\['image\/jpeg','image\/png','image\/webp'\]/)})
test('cada meta pode ter no máximo uma capa',()=>{assert.match(migration,/create unique index goal_images_one_cover on public\.goal_images\(goal_id\) where is_cover/)})
test('frases e imagens referenciam metas do mesmo usuário; frases da mesma board',()=>{assert.match(migration,/foreign key\(goal_id,user_id\) references public\.goals\(id,user_id\)/);assert.match(migration,/foreign key\(goal_id,vision_board_id,user_id\) references public\.goals\(id,vision_board_id,user_id\)/)})
test('telas privadas só aparecem após uma sessão autenticada',()=>{assert.match(app,/if\(!session\)return <Login/);assert.match(app,/onAuthStateChange/)})
