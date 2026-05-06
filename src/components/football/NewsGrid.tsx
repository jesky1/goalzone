'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NewsCard from './NewsCard';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Article {
  id: string;
  title: string;
  slug: string;
  summary: string | null;
  imageUrl: string | null;
  category: { name: string; slug: string };
  author: { username: string };
  viewCount: number;
  readTime: number;
  createdAt: string;
}

function NewsCardSkeleton({ featured = false }: { featured?: boolean }) {
  if (featured) {
    return (
      <div className="glass-card overflow-hidden col-span-1 md:col-span-2">
        <div className="flex flex-col md:flex-row">
          <div className="w-full md:w-1/2 h-64 md:h-auto min-h-[250px]">
            <Skeleton className="w-full h-full" />
          </div>
          <div className="p-5 md:p-6 flex flex-col gap-3 flex-1">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-7 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden flex flex-col">
      <div className="w-full h-48">
        <Skeleton className="w-full h-full" />
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="mt-auto pt-3 border-t border-white/5 flex gap-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

export default function NewsGrid({
  onArticleClick,
}: {
  onArticleClick?: (article: Article) => void;
}) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/categories');
        if (res.ok && !cancelled) {
          const data = await res.json();
          setCategories(data.categories || data || []);
        }
      } catch {
        // silently fail
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const load = async () => {
      try {
        let url = '/api/articles?limit=12';
        if (activeCategory && activeCategory !== 'all') {
          url += `&category=${activeCategory}`;
        }
        const res = await fetch(url);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setArticles(data.articles || data || []);
        }
      } catch {
        // silently fail
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [activeCategory]);

  return (
    <section id="home" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Category Tabs */}
      {categories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6"
        >
          <Tabs
            value={activeCategory}
            onValueChange={setActiveCategory}
            defaultValue="all"
          >
            <TabsList className="bg-white/5 border border-white/10 rounded-lg">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-neon/10 data-[state=active]:text-neon rounded-md text-xs sm:text-sm"
              >
                Semua
              </TabsTrigger>
              {categories.map((cat) => (
                <TabsTrigger
                  key={cat.slug}
                  value={cat.slug}
                  className="data-[state=active]:bg-neon/10 data-[state=active]:text-neon rounded-md text-xs sm:text-sm"
                >
                  {cat.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <NewsCardSkeleton featured />
          <NewsCardSkeleton />
          <NewsCardSkeleton />
          <NewsCardSkeleton />
          <NewsCardSkeleton />
          <NewsCardSkeleton />
        </div>
      )}

      {/* Articles Grid */}
      {!loading && articles.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {articles.map((article, index) => (
            <NewsCard
              key={article.id}
              article={article}
              variant={index === 0 ? 'featured' : 'default'}
              index={index}
              onClick={onArticleClick}
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && articles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-4 opacity-20">⚽</div>
          <p className="text-muted-foreground text-sm">
            Belum ada berita tersedia
          </p>
        </div>
      )}
    </section>
  );
}
