// ============================================================
// GOALZONE Admin API - Express + Prisma + JWT
// ============================================================
// Port: 3001
// Endpoints:
//   POST /login              - Auth admin, return JWT token
//   GET  /data               - Protected: ambil semua data (articles + stats)
//   GET  /data/articles      - Protected: daftar artikel
//   GET  /data/stats         - Protected: statistik dashboard
//   POST /data/articles      - Protected: buat artikel baru
//   PUT  /data/articles/:id  - Protected: update artikel
//   DELETE /data/articles/:id - Protected: hapus artikel
//   GET  /verify              - Cek token valid
//
// Auth: Bearer JWT token di Authorization header
// ============================================================

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// --- Config ---
const PORT = 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'goalzone-admin-secret-key-2025';
const JWT_EXPIRES_IN = '24h';

// --- Express Setup ---
const app = express();
app.use(cors());
app.use(express.json());

// ============================================================
// JWT Middleware
// ============================================================
function authenticate(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: 'Unauthorized. Sertakan header: Authorization: Bearer <token>',
    });
    return;
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string; role: string };
    (req as any).user = decoded;
    next();
  } catch {
    res.status(401).json({
      success: false,
      error: 'Token tidak valid atau sudah expired',
    });
  }
}

// ============================================================
// POST /login - Autentikasi Admin
// ============================================================
app.post('/login', async (req: express.Request, res: express.Response) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ success: false, error: 'Username dan password wajib diisi' });
      return;
    }

    // Cari admin di database
    const admin = await prisma.profile.findUnique({ where: { username } });

    if (!admin) {
      res.status(401).json({ success: false, error: 'Username atau password salah' });
      return;
    }

    // Demo: password "admin123" untuk user "admin"
    // Production: ganti dengan bcrypt.compare
    let isMatch = false;
    if (admin.passwordHash) {
      isMatch = await bcrypt.compare(password, admin.passwordHash);
    } else {
      isMatch = username === 'admin' && password === 'admin123';
    }

    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Username atau password salah' });
      return;
    }

    // Generate JWT
    const token = jwt.sign(
      { id: admin.id, username: admin.username, role: admin.role || 'admin' },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Login berhasil',
      data: {
        token,
        expiresIn: JWT_EXPIRES_IN,
        user: {
          id: admin.id,
          username: admin.username,
          fullName: admin.username,
          role: admin.role || 'admin',
        },
      },
    });
  } catch (error: any) {
    console.error('[Login Error]', error.message);
    res.status(500).json({ success: false, error: 'Terjadi kesalahan server' });
  }
});

// ============================================================
// GET /data - Protected: Semua data + stats
// ============================================================
app.get('/data', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const [totalArticles, totalComments, totalViews, featuredArticles, categories] = await Promise.all([
      prisma.article.count(),
      prisma.comment.count(),
      prisma.article.aggregate({ _sum: { viewCount: true } }),
      prisma.article.count({ where: { isFeatured: true } }),
      prisma.category.findMany({ include: { _count: { select: { articles: true } } }, orderBy: { name: 'asc' } }),
    ]);

    const articles = await prisma.article.findMany({
      include: {
        category: { select: { name: true } },
        author: { select: { username: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const recentComments = await prisma.comment.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { username: true } },
        article: { select: { title: true } },
      },
    });

    res.json({
      success: true,
      data: {
        stats: {
          totalArticles,
          totalComments,
          totalViews: totalViews._sum.viewCount || 0,
          featuredArticles,
          totalCategories: categories.length,
        },
        articles: articles.map((a) => ({
          ...a,
          categoryName: a.category?.name || null,
          authorName: a.author?.username || null,
          category: undefined,
          author: undefined,
        })),
        categories: categories.map((c) => ({ ...c, articleCount: c._count.articles })),
        recentComments: recentComments.map((c) => ({
          id: c.id,
          text: c.text,
          createdAt: c.createdAt,
          authorName: c.user?.username || 'Anonymous',
          articleTitle: c.article?.title || null,
        })),
      },
    });
  } catch (error: any) {
    console.error('[Data Error]', error.message);
    res.status(500).json({ success: false, error: 'Gagal mengambil data' });
  }
});

// ============================================================
// GET /data/articles - Protected: Daftar artikel
// ============================================================
app.get('/data/articles', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const { search, category, limit = '50', offset = '0' } = req.query;

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: String(search) } },
        { summary: { contains: String(search) } },
      ];
    }
    if (category) {
      where.category = { slug: String(category) };
    }

    const [articles, total] = await Promise.all([
      prisma.article.findMany({
        where,
        include: {
          category: { select: { name: true } },
          author: { select: { username: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: Number(limit),
        skip: Number(offset),
      }),
      prisma.article.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        articles: articles.map((a) => ({
          ...a,
          categoryName: a.category?.name || null,
          authorName: a.author?.username || null,
          category: undefined,
          author: undefined,
        })),
        total,
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error: any) {
    console.error('[Articles Error]', error.message);
    res.status(500).json({ success: false, error: 'Gagal mengambil artikel' });
  }
});

// ============================================================
// GET /data/stats - Protected: Statistik
// ============================================================
app.get('/data/stats', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const [totalArticles, totalComments, viewsAgg, featured, categories, topViewed] = await Promise.all([
      prisma.article.count(),
      prisma.comment.count(),
      prisma.article.aggregate({ _sum: { viewCount: true } }),
      prisma.article.count({ where: { isFeatured: true } }),
      prisma.category.count(),
      prisma.article.findMany({ orderBy: { viewCount: 'desc' }, take: 5, select: { id: true, title: true, viewCount: true } }),
    ]);

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const articlesPerDay = await prisma.$queryRawUnsafe(`
      SELECT DATE(createdAt) as date, COUNT(*) as count
      FROM Article
      WHERE createdAt >= '${sevenDaysAgo.toISOString().split('T')[0]}'
      GROUP BY DATE(createdAt)
      ORDER BY date DESC
    `) as any[];

    res.json({
      success: true,
      data: {
        overview: { totalArticles, totalComments, totalViews: viewsAgg._sum.viewCount || 0, featured, categories },
        topViewed,
        articlesPerDay,
      },
    });
  } catch (error: any) {
    console.error('[Stats Error]', error.message);
    res.status(500).json({ success: false, error: 'Gagal mengambil statistik' });
  }
});

// ============================================================
// POST /data/articles - Protected: Buat artikel
// ============================================================
app.post('/data/articles', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const { title, slug, content, summary, imageUrl, categoryId, authorId, isFeatured, readTime } = req.body;

    if (!title || !slug || !content || !categoryId) {
      res.status(400).json({ success: false, error: 'title, slug, content, categoryId wajib diisi' });
      return;
    }

    const article = await prisma.article.create({
      data: {
        title,
        slug,
        content,
        summary: summary || null,
        imageUrl: imageUrl || null,
        categoryId,
        authorId: authorId || null,
        isFeatured: isFeatured || false,
        readTime: readTime || 5,
      },
      include: {
        category: { select: { name: true } },
        author: { select: { username: true } },
      },
    });

    res.status(201).json({ success: true, message: 'Artikel berhasil dibuat', data: article });
  } catch (error: any) {
    console.error('[Create Article Error]', error.message);
    res.status(500).json({ success: false, error: 'Gagal membuat artikel' });
  }
});

// ============================================================
// PUT /data/articles/:id - Protected: Update artikel
// ============================================================
app.put('/data/articles/:id', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { title, slug, content, summary, imageUrl, categoryId, isFeatured, readTime } = req.body;

    const existing = await prisma.article.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Artikel tidak ditemukan' });
      return;
    }

    const article = await prisma.article.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(content !== undefined && { content }),
        ...(summary !== undefined && { summary }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(categoryId !== undefined && { categoryId }),
        ...(isFeatured !== undefined && { isFeatured }),
        ...(readTime !== undefined && { readTime }),
      },
      include: {
        category: { select: { name: true } },
        author: { select: { username: true } },
      },
    });

    res.json({ success: true, message: 'Artikel berhasil diupdate', data: article });
  } catch (error: any) {
    console.error('[Update Article Error]', error.message);
    res.status(500).json({ success: false, error: 'Gagal mengupdate artikel' });
  }
});

// ============================================================
// DELETE /data/articles/:id - Protected: Hapus artikel
// ============================================================
app.delete('/data/articles/:id', authenticate, async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.article.findUnique({ where: { id }, select: { id: true, title: true } });
    if (!existing) {
      res.status(404).json({ success: false, error: 'Artikel tidak ditemukan' });
      return;
    }

    await prisma.comment.deleteMany({ where: { articleId: id } });
    await prisma.article.delete({ where: { id } });

    res.json({ success: true, message: `Artikel "${existing.title}" berhasil dihapus` });
  } catch (error: any) {
    console.error('[Delete Article Error]', error.message);
    res.status(500).json({ success: false, error: 'Gagal menghapus artikel' });
  }
});

// ============================================================
// GET /verify - Cek token valid
// ============================================================
app.get('/verify', authenticate, (req: express.Request, res: express.Response) => {
  const user = (req as any).user;
  res.json({ success: true, data: { id: user.id, username: user.username, role: user.role } });
});

// ============================================================
// 404 Handler
// ============================================================
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ success: false, error: `Route ${req.method} ${req.path} tidak ditemukan` });
});

// ============================================================
// Start Server
// ============================================================
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════════════╗
  ║   GOALZONE Admin API                            ║
  ║   Port: ${PORT}                                    ║
  ║                                                  ║
  ║   POST /login               - Autentikasi admin   ║
  ║   GET  /verify               - Cek token           ║
  ║   GET  /data                 - Semua data + stats  ║
  ║   GET  /data/articles        - Daftar artikel     ║
  ║   GET  /data/stats           - Statistik          ║
  ║   POST /data/articles        - Buat artikel       ║
  ║   PUT  /data/articles/:id    - Update artikel      ║
  ║   DELETE /data/articles/:id  - Hapus artikel      ║
  ║                                                  ║
  ║   Demo login: admin / admin123                   ║
  ╚══════════════════════════════════════════════════╝
  `);
});
