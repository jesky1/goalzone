// ============================================================
// GOALZONE — Unified Article Store (3-tier storage)
// ============================================================
// Tries: Supabase → Prisma/SQLite → In-memory cache → Mock data
// Works in sandbox (single process), localhost, and Vercel
// ============================================================

// ─── Types ───────────────────────────────────────────────────

export interface StoredArticle {
  id: string
  title: string
  slug: string
  content: string
  summary: string | null
  imageUrl: string | null
  categoryId: string
  authorId: string
  authorName?: string
  categoryName?: string
  status: string
  isFeatured: boolean
  viewCount: number
  readTime: number
  createdAt: string
  updatedAt: string
}

interface SaveResult {
  success: boolean
  source: 'supabase' | 'prisma' | 'cache' | 'none'
  article?: StoredArticle
  error?: string
}

// ─── In-Memory Cache (always available) ──────────────────────

const memoryCache: Map<string, StoredArticle> = new Map()

// Check if DATABASE_URL is available (Prisma safe to use)
let prismaAvailable: boolean | null = null

async function isPrismaAvailable(): Promise<boolean> {
  if (prismaAvailable !== null) return prismaAvailable
  try {
    if (!process.env.DATABASE_URL) {
      prismaAvailable = false
      return false
    }
    // Use require for synchronous check (works in Node.js server-side)
    const { db } = await import('@/lib/db')
    await db.$queryRaw`SELECT 1`
    prismaAvailable = true
    return true
  } catch (err: any) {
    // Prisma client might throw if DATABASE_URL env is set but DB file doesn't exist
    // or if Prisma Client hasn't been generated
    console.warn('[ArticleStore] Prisma check failed:', err.message?.substring(0, 100))
    prismaAvailable = false
    return false
  }
}

// Check if Supabase is available
let supabaseAvailable: boolean | null = null

async function isSupabaseAvailable(): Promise<boolean> {
  if (supabaseAvailable !== null) return supabaseAvailable
  try {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      supabaseAvailable = false
      return false
    }
    const { createServerSupabaseClient } = await import('@/lib/supabase/client')
    const supabase = createServerSupabaseClient()
    const { error } = await supabase.from('categories').select('id').limit(1)
    supabaseAvailable = !error
    return !error
  } catch {
    supabaseAvailable = false
    return false
  }
}

// ─── Save Article ───────────────────────────────────────────

export async function saveArticle(article: {
  title: string
  slug: string
  content: string
  summary: string | null
  imageUrl: string | null
  categorySlug: string
  categoryName: string
  authorName: string
  readTime: number
}): Promise<SaveResult> {
  // 1. Try Supabase
  try {
    if (await isSupabaseAvailable()) {
      const { createServerSupabaseClient } = await import('@/lib/supabase/client')
      const supabase = createServerSupabaseClient()

      // Find or create category
      let categoryId: string | null = null
      const { data: cat } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', article.categorySlug)
        .maybeSingle()
      if (cat) categoryId = cat.id
      else {
        const { data: newCat } = await supabase
          .from('categories')
          .insert({ name: article.categoryName, slug: article.categorySlug, color: '#00f0ff', is_active: true })
          .select('id')
          .single()
        if (newCat) categoryId = newCat.id
      }

      // Find author
      let authorId: string | null = null
      const { data: author } = await supabase
        .from('profiles')
        .select('id')
        .in('role', ['editor', 'admin'])
        .limit(1)
        .maybeSingle()
      if (author) authorId = author.id

      if (categoryId && authorId) {
        const { data, error } = await supabase
          .from('articles')
          .insert({
            title: article.title,
            slug: article.slug,
            content: article.content,
            summary: article.summary,
            cover_image: article.imageUrl,
            category_id: categoryId,
            author_id: authorId,
            status: 'published',
            is_featured: false,
            read_time: article.readTime,
            seo_title: article.title,
            published_at: new Date().toISOString(),
          })
          .select('*, categories(name, slug), profiles(username)')
          .single()

        if (!error && data) {
          const stored: StoredArticle = {
            id: data.id,
            title: data.title,
            slug: data.slug,
            content: data.content,
            summary: data.summary,
            imageUrl: data.cover_image,
            categoryId: data.category_id,
            authorId: data.author_id,
            authorName: data.profiles?.username,
            categoryName: data.categories?.name,
            status: data.status,
            isFeatured: data.is_featured,
            viewCount: data.view_count,
            readTime: data.read_time,
            createdAt: data.created_at,
            updatedAt: data.updated_at,
          }
          // Also cache in memory for fast reads
          memoryCache.set(data.slug, stored)
          return { success: true, source: 'supabase', article: stored }
        }
      }
    }
  } catch (err: any) {
    console.warn('[ArticleStore] Supabase save failed:', err.message)
  }

  // 2. Try Prisma/SQLite
  try {
    if (await isPrismaAvailable()) {
      const { db } = await import('@/lib/db')

      let categoryId: string | null = null
      const cat = await db.category.findUnique({ where: { slug: article.categorySlug } })
      if (cat) categoryId = cat.id
      else {
        const newCat = await db.category.create({
          data: { name: article.categoryName, slug: article.categorySlug },
        })
        categoryId = newCat.id
      }

      let authorId: string | null = null
      const author = await db.profile.findFirst({ where: { role: { in: ['admin', 'editor'] } } })
      if (author) authorId = author.id
      else {
        const anyAuthor = await db.profile.findFirst()
        if (anyAuthor) authorId = anyAuthor.id
      }

      if (categoryId && authorId) {
        // Check slug uniqueness
        let finalSlug = article.slug
        let attempt = 0
        while (attempt < 10) {
          const exists = await db.article.findUnique({ where: { slug: finalSlug }, select: { id: true } })
          if (!exists) break
          attempt++
          finalSlug = attempt === 1
            ? `${article.slug}-${new Date().toISOString().split('T')[0]}`
            : `${article.slug}-${new Date().toISOString().split('T')[0]}-${attempt}`
        }

        const saved = await db.article.create({
          data: {
            title: article.title,
            slug: finalSlug,
            content: article.content,
            summary: article.summary,
            imageUrl: article.imageUrl,
            categoryId,
            authorId,
            readTime: article.readTime,
            isFeatured: false,
            viewCount: 0,
          },
          include: { category: { select: { name: true, slug: true } }, author: { select: { username: true } } },
        })

        const stored: StoredArticle = {
          id: saved.id,
          title: saved.title,
          slug: saved.slug,
          content: saved.content,
          summary: saved.summary,
          imageUrl: saved.imageUrl,
          categoryId: saved.categoryId,
          authorId: saved.authorId,
          authorName: saved.author.username,
          categoryName: saved.category.name,
          status: 'published',
          isFeatured: saved.isFeatured,
          viewCount: saved.viewCount,
          readTime: saved.readTime,
          createdAt: saved.createdAt.toISOString(),
          updatedAt: saved.updatedAt.toISOString(),
        }
        // Also cache in memory
        memoryCache.set(saved.slug, stored)
        return { success: true, source: 'prisma', article: stored }
      }
    }
  } catch (err: any) {
    console.warn('[ArticleStore] Prisma save failed:', err.message)
  }

  // 3. In-memory cache (always works)
  const id = `local-${Date.now()}`
  const stored: StoredArticle = {
    id,
    title: article.title,
    slug: article.slug,
    content: article.content,
    summary: article.summary,
    imageUrl: article.imageUrl,
    categoryId: article.categorySlug,
    authorId: 'ai',
    authorName: article.authorName || 'GOALZONE AI',
    categoryName: article.categoryName,
    status: 'published',
    isFeatured: false,
    viewCount: 0,
    readTime: article.readTime,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  memoryCache.set(article.slug, stored)
  return { success: true, source: 'cache', article: stored }
}

// ─── Fetch Articles ──────────────────────────────────────────

export async function fetchArticles(options?: {
  category?: string
  search?: string
  featured?: boolean
  limit?: number
  offset?: number
}): Promise<{ articles: StoredArticle[]; total: number; source: string }> {
  const limit = options?.limit || 12
  const offset = options?.offset || 0

  // 1. Try Supabase
  try {
    if (await isSupabaseAvailable()) {
      const { createServerSupabaseClient } = await import('@/lib/supabase/client')
      const supabase = createServerSupabaseClient()

      let query = supabase
        .from('articles')
        .select('*, categories(name, slug), profiles(username, full_name, avatar_url)', { count: 'exact', head: true })
        .eq('status', 'published')

      if (options?.search) {
        query = query.or(`title.ilike.%${options.search}%,summary.ilike.%${options.search}%`)
      }
      if (options?.featured) {
        query = query.eq('is_featured', true)
      }
      const { count } = await query

      let dataQuery = supabase
        .from('articles')
        .select('*, categories(name, slug, color), profiles(username, full_name, avatar_url)')
        .eq('status', 'published')

      if (options?.search) {
        dataQuery = dataQuery.or(`title.ilike.%${options.search}%,summary.ilike.%${options.search}%`)
      }
      if (options?.featured) {
        dataQuery = dataQuery.eq('is_featured', true)
      }

      const { data: rows, error } = await dataQuery
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (!error && rows && rows.length > 0) {
        const articles = rows.map((r: any) => ({
          id: r.id, title: r.title, slug: r.slug, content: r.content,
          summary: r.summary, imageUrl: r.cover_image,
          categoryId: r.category_id, authorId: r.author_id,
          authorName: r.profiles?.username || r.profiles?.full_name,
          categoryName: r.categories?.name,
          status: r.status, isFeatured: r.is_featured,
          viewCount: r.view_count, readTime: r.read_time,
          createdAt: r.created_at, updatedAt: r.updated_at,
        }))
        // Merge with cache articles that aren't in Supabase yet
        const merged = mergeWithCache(articles)
        return { articles: merged.slice(offset, offset + limit), total: merged.length, source: 'supabase' }
      }
    }
  } catch (err: any) {
    console.warn('[ArticleStore] Supabase fetch failed:', err.message)
  }

  // 2. Try Prisma/SQLite
  try {
    if (await isPrismaAvailable()) {
      const { db } = await import('@/lib/db')

      const where: any = {}
      if (options?.category) {
        where.category = { slug: options.category }
      }
      if (options?.featured) {
        where.isFeatured = true
      }
      if (options?.search) {
        where.OR = [
          { title: { contains: options.search } },
          { summary: { contains: options.search } },
        ]
      }

      const total = await db.article.count({ where })
      const rows = await db.article.findMany({
        where,
        include: { category: { select: { name: true, slug: true } }, author: { select: { username: true } } },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      })

      if (rows.length > 0) {
        const articles = rows.map((r) => ({
          id: r.id, title: r.title, slug: r.slug, content: r.content,
          summary: r.summary, imageUrl: r.imageUrl,
          categoryId: r.categoryId, authorId: r.authorId,
          authorName: r.author.username, categoryName: r.category.name,
          status: 'published', isFeatured: r.isFeatured,
          viewCount: r.viewCount, readTime: r.readTime,
          createdAt: r.createdAt.toISOString(), updatedAt: r.updatedAt.toISOString(),
        }))
        const merged = mergeWithCache(articles)
        return { articles: merged.slice(offset, offset + limit), total: merged.length, source: 'prisma' }
      }
    }
  } catch (err: any) {
    console.warn('[ArticleStore] Prisma fetch failed:', err.message)
  }

  // 3. In-memory cache
  const cacheArticles = Array.from(memoryCache.values())
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  if (cacheArticles.length > 0) {
    return {
      articles: cacheArticles.slice(offset, offset + limit),
      total: cacheArticles.length,
      source: 'cache',
    }
  }

  // 4. Nothing found
  return { articles: [], total: 0, source: 'none' }
}

// ─── Fetch Single Article by Slug ───────────────────────────

export async function fetchArticleBySlug(slug: string): Promise<StoredArticle | null> {
  // Check memory cache first (fastest)
  if (memoryCache.has(slug)) {
    return memoryCache.get(slug)!
  }

  // Try Supabase
  try {
    if (await isSupabaseAvailable()) {
      const { createServerSupabaseClient } = await import('@/lib/supabase/client')
      const supabase = createServerSupabaseClient()
      const { data, error } = await supabase
        .from('articles')
        .select('*, categories(name, slug, color), profiles(username, full_name, avatar_url)')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle()

      if (!error && data) {
        const article: StoredArticle = {
          id: data.id, title: data.title, slug: data.slug, content: data.content,
          summary: data.summary, imageUrl: data.cover_image,
          categoryId: data.category_id, authorId: data.author_id,
          authorName: data.profiles?.username || data.profiles?.full_name,
          categoryName: data.categories?.name,
          status: data.status, isFeatured: data.is_featured,
          viewCount: data.view_count, readTime: data.read_time,
          createdAt: data.created_at, updatedAt: data.updated_at,
        }
        return article
      }
    }
  } catch {
    // skip
  }

  // Try Prisma
  try {
    if (await isPrismaAvailable()) {
      const { db } = await import('@/lib/db')
      const row = await db.article.findUnique({
        where: { slug },
        include: { category: { select: { name: true, slug: true } }, author: { select: { username: true } } },
      })
      if (row) {
        return {
          id: row.id, title: row.title, slug: row.slug, content: row.content,
          summary: row.summary, imageUrl: row.imageUrl,
          categoryId: row.categoryId, authorId: row.authorId,
          authorName: row.author.username, categoryName: row.category.name,
          status: 'published', isFeatured: row.isFeatured,
          viewCount: row.viewCount, readTime: row.readTime,
          createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString(),
        }
      }
    }
  } catch {
    // skip
  }

  return null
}

// ─── Increment View Count ───────────────────────────────────

export async function incrementViewCount(slug: string): Promise<void> {
  try {
    if (await isSupabaseAvailable()) {
      const { createServerSupabaseClient } = await import('@/lib/supabase/client')
      await createServerSupabaseClient().rpc('increment_view_count', { article_slug: slug })
      return
    }
  } catch { /* skip */ }

  try {
    if (await isPrismaAvailable()) {
      const { db } = await import('@/lib/db')
      await db.article.update({ where: { slug }, data: { viewCount: { increment: 1 } } })
      return
    }
  } catch { /* skip */ }

  // In-memory fallback
  const cached = memoryCache.get(slug)
  if (cached) cached.viewCount++
}

// ─── Helpers ────────────────────────────────────────────────

function mergeWithCache(dbArticles: StoredArticle[]): StoredArticle[] {
  const dbSlugs = new Set(dbArticles.map(a => a.slug))
  const cacheOnly = Array.from(memoryCache.values())
    .filter(a => !dbSlugs.has(a.slug))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return [...dbArticles, ...cacheOnly]
}

// ─── Get Memory Cache Stats (for debugging) ─────────────────

export function getCacheStats() {
  return {
    memoryCacheSize: memoryCache.size,
    prismaAvailable,
    supabaseAvailable,
  }
}
