import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const allowedOrigins = new Set([
  'https://nalifazarte.github.io',
  'http://localhost:5173',
])
const allowedHeaders = 'authorization, x-client-info, apikey, content-type'

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

function response(body: unknown, status: number, origin: string | null) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Headers': allowedHeaders,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
  }
  if (origin && allowedOrigins.has(origin)) headers['Access-Control-Allow-Origin'] = origin
  return new Response(JSON.stringify(body), { status, headers })
}

Deno.serve(async (request) => {
  const origin = request.headers.get('Origin')
  if (request.method === 'OPTIONS') return response({ ok: true }, 200, origin)
  if (request.method !== 'POST') return response({ error: 'Método não permitido.' }, 405, origin)
  if (!origin || !allowedOrigins.has(origin)) return response({ error: 'Origem não autorizada.' }, 403, origin)

  const authorization = request.headers.get('Authorization')
  const apiKey = Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? secretFromJson('SUPABASE_PUBLISHABLE_KEYS')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const pexelsKey = Deno.env.get('PEXELS_API_KEY')
  if (!authorization || !apiKey || !supabaseUrl) return response({ error: 'Sessão ou configuração do serviço inválida.' }, 401, origin)
  if (!pexelsKey) return response({ error: 'A busca de imagens ainda não foi configurada.' }, 503, origin)

  const supabase = createClient(supabaseUrl, apiKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return response({ error: 'Entre novamente para usar a busca de imagens.' }, 401, origin)

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return response({ error: 'Pedido inválido.' }, 400, origin)
  }

  if (body.action === 'search') {
    const query = typeof body.query === 'string' ? body.query.trim().slice(0, 100) : ''
    if (query.length < 2) return response({ error: 'Digite pelo menos duas letras para buscar.' }, 400, origin)
    const params = new URLSearchParams({ query, per_page: '18', locale: 'pt-BR', orientation: 'portrait' })
    const result = await fetch(`https://api.pexels.com/v1/search?${params}`, {
      headers: { Authorization: pexelsKey },
    })
    if (!result.ok) return response({ error: result.status === 429 ? 'A busca de imagens atingiu o limite temporário. Tente mais tarde.' : 'Não foi possível buscar imagens no Pexels.' }, result.status === 429 ? 429 : 502, origin)
    const payload = await result.json()
    const photos = (payload.photos ?? []).map((photo: any) => ({
      id: photo.id,
      alt: photo.alt ?? '',
      photographer: photo.photographer,
      photographer_url: photo.photographer_url,
      url: photo.url,
      src: { medium: photo.src?.medium, large: photo.src?.large },
    }))
    return response({ photos }, 200, origin)
  }

  if (body.action === 'import') {
    const photoId = Number(body.photoId)
    const goalId = typeof body.goalId === 'string' ? body.goalId : ''
    const isCover = body.isCover === true
    const sortOrder = Number.isInteger(body.sortOrder) ? Number(body.sortOrder) : 0
    if (!Number.isSafeInteger(photoId) || photoId <= 0 || !goalId) return response({ error: 'Imagem ou meta inválida.' }, 400, origin)

    const { data: goal } = await supabase.from('goals').select('id').eq('id', goalId).maybeSingle()
    if (!goal) return response({ error: 'Essa meta não existe ou não pertence a esta conta.' }, 404, origin)

    const { data: existing } = await supabase.from('goal_images')
      .select('id,storage_path,is_cover,sort_order,photographer,photographer_url,source_url')
      .eq('goal_id', goalId).eq('pexels_photo_id', photoId).maybeSingle()
    if (existing) {
      const { data: signed } = await supabase.storage.from('visionboard-private').createSignedUrl(existing.storage_path, 3600)
      return response({ image: existing, signedUrl: signed?.signedUrl ?? null, existing: true }, 200, origin)
    }

    const detailResponse = await fetch(`https://api.pexels.com/v1/photos/${photoId}`, {
      headers: { Authorization: pexelsKey },
    })
    if (!detailResponse.ok) return response({ error: 'O Pexels não encontrou mais essa foto.' }, 502, origin)
    const photo = await detailResponse.json()
    const imageUrl = typeof photo.src?.medium === 'string' ? photo.src.medium : ''
    let imageHost: string
    try { imageHost = new URL(imageUrl).hostname } catch { imageHost = '' }
    if (imageHost !== 'images.pexels.com') return response({ error: 'Endereço da imagem não permitido.' }, 400, origin)

    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) return response({ error: 'Não foi possível baixar a foto selecionada.' }, 502, origin)
    const mime = (imageResponse.headers.get('Content-Type') ?? '').split(';')[0].toLowerCase()
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(mime)) return response({ error: 'O formato desta foto não é compatível.' }, 415, origin)
    const bytes = new Uint8Array(await imageResponse.arrayBuffer())
    if (bytes.byteLength > 10 * 1024 * 1024) return response({ error: 'Esta foto excede o limite de 10 MB.' }, 413, origin)

    const extension = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg'
    const storagePath = `${user.id}/goals/${goalId}/pexels-${photoId}-${crypto.randomUUID()}.${extension}`
    const { error: uploadError } = await supabase.storage.from('visionboard-private').upload(storagePath, bytes, {
      contentType: mime,
      upsert: false,
    })
    if (uploadError) return response({ error: 'Não foi possível guardar a foto no seu espaço privado.' }, 500, origin)

    const { data: image, error: insertError } = await supabase.from('goal_images').insert({
      goal_id: goalId,
      storage_path: storagePath,
      source_type: 'pexels',
      pexels_photo_id: photo.id,
      photographer: photo.photographer,
      photographer_url: photo.photographer_url,
      source_url: photo.url,
      is_cover: isCover,
      sort_order: sortOrder,
    }).select('id,storage_path,is_cover,sort_order,source_type,photographer,photographer_url,source_url').single()
    if (insertError) {
      await supabase.storage.from('visionboard-private').remove([storagePath])
      return response({ error: 'A foto foi baixada, mas não foi possível vinculá-la à meta.' }, 500, origin)
    }
    const { data: signed } = await supabase.storage.from('visionboard-private').createSignedUrl(storagePath, 3600)
    return response({ image, signedUrl: signed?.signedUrl ?? null }, 200, origin)
  }

  return response({ error: 'Ação desconhecida.' }, 400, origin)
})