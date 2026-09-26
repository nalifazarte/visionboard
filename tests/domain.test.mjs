import test from 'node:test'
import assert from 'node:assert/strict'
import { goalUpdate,isOverdue,normalizeProgress,quarterLabel,validateImage } from '../src/lib/domain.ts'
const meta=(patch={})=>({id:'a',title:'Meta',description:null,quarter:null,due_date:'2026-01-01',status:'in_progress',progress:40,created_at:'2026-01-01',...patch})
test('progresso permanece entre zero e cem',()=>{assert.equal(normalizeProgress(60.4),60);assert.throws(()=>normalizeProgress(101));assert.throws(()=>normalizeProgress(-1))})
test('conclusão define 100% e reabrir limpa data',()=>{const done=goalUpdate('completed',20,false);assert.equal(done.progress,100);assert.equal(typeof done.completed_at,'string');assert.equal(goalUpdate('in_progress',20,true).completed_at,null)})
test('identifica somente metas incompletas com prazo passado',()=>{assert.equal(isOverdue(meta(),'2026-02-01'),true);assert.equal(isOverdue(meta({status:'completed'}),'2026-02-01'),false);assert.equal(isOverdue(meta({due_date:null}),'2026-02-01'),false)})
test('distingue trimestre e ano inteiro',()=>{assert.equal(quarterLabel(3),'3º trimestre');assert.equal(quarterLabel(null),'Ano inteiro')})
test('valida MIME e limite de 10 MB',()=>{assert.throws(()=>validateImage({type:'image/svg+xml',size:1}));assert.throws(()=>validateImage({type:'image/jpeg',size:10*1024*1024+1}));assert.doesNotThrow(()=>validateImage({type:'image/webp',size:100}))})
