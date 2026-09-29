import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const allowedOrigins = new Set([
  'https://nalifazarte.github.io',
  'http://localhost:5173',
])
const bucket = 'visionboard-private'

function secretFromJson(name: string): string | undefined {
  const raw = Deno.env.get(name)
  if (!raw) return undefined
  try {
    const values = JSON.parse(raw) as Record<string, unknown>
    const value = values.default
    return typeof value === 'string' ? value : undefined
  } catch {
    return undefined
  }
}

function reply(body: unknown, status: number, origin: string | null) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
  if (origin && allowedOrigins.has(origin)) headers['Access-Control-Allow-Origin'] = origin
  return new Response(JSON.stringify(body), { status, headers })
}

Deno.serve(async (request) => {
  const origin = request.headers.get('Origin')
  if (request.method === 'OPTIONS') return reply({ ok: true }, 200, origin)
  if (request.method !== 'POST') return reply({ error: 'Método não permitido.' }, 405, origin)
  if (!origin || !allowedOrigins.has(origin)) return reply({ error: 'Origem não autorizada.' }, 403, origin)

  let body: Record<string, unknown>
  try { body = await request.json() } catch { return reply({ error: 'Pedido inválido.' }, 400, origin) }
  if (body.confirmation !== 'EXCLUIR') return reply({ error: 'Confirmação inválida.' }, 400, origin)

  const authorization = request.headers.get('Authorization')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const publishableKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? secretFromJson('SUPABASE_PUBLISHABLE_KEYS')
  const adminKey = Deno.env.get('SUPABASE_SECRET_KEY') ?? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? secretFromJson('SUPABASE_SECRET_KEYS')
  if (!authorization || !supabaseUrl || !publishableKey) return reply({ error: 'Não foi possível validar sua sessão.' }, 401, origin)
  if (!adminKey) return reply({ error: 'A exclusão segura ainda não foi configurada.' }, 503, origin)

  const userClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: { user }, error: userError } = await userClient.auth.getUser()
  if (userError || !user) return reply({ error: 'Sua sessão expirou. Entre novamente e tente de novo.' }, 401, origin)

  const admin = createClient(supabaseUrl, adminKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })

  try {
    // Storage objects are not removed by deleting the Auth user. Remove only this user's folder first.
    const files: string[] = []
    async function collectFiles(folder: string) {
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await admin.storage.from(bucket).list(folder, { limit: 1000, offset })
        if (error) throw error
        const entries = data ?? []
        for (const entry of entries) {
          const path = `${folder}/${entry.name}`
          if (entry.id) files.push(path)
          else await collectFiles(path)
        }
        if (entries.length < 1000) break
      }
    }
    await collectFiles(user.id)
    for (let offset = 0; offset < files.length; offset += 100) {
      const { error } = await admin.storage.from(bucket).remove(files.slice(offset, offset + 100))
      if (error) throw error
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id, false)
    if (deleteError) throw deleteError
    return reply({ ok: true }, 200, origin)
  } catch (error) {
    console.error('Account deletion failed', error)
    return reply({ error: 'Não foi possível concluir a exclusão. Tente novamente ou fale com quem administra o app.' }, 500, origin)
  }
})