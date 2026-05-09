'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';

interface FeaturedArticle {
  id: string;
  title: string;
  summary: string | null;
  imageUrl: string | null;
  category: { name: string; slug: string };
  readTime: number;
  slug: string;
}

export default function HeroSlider() {
  const [articles, setArticles] = useState<FeaturedArticle[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch('/api/articles?featured=true&limit=5');
        if (res.ok && !cancelled) {
          const data = await res.json();
          const list = data.articles || [];
          if (Array.isArray(list)) {
            setArticles(list);
          }
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
    if (articles.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % articles.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [articles.length]);

  if (articles.length === 0) return null;

  const article = articles[current];

  return (
    <section
      id="home"
      className="relative w-full h-[450px] sm:h-[500px] md:h-[550px] overflow-hidden"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={article.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.7 }}
          className="absolute inset-0"
        >
          {/* Background Image */}
          {article.imageUrl && (
            <Image
              src={article.imageUrl}
              alt={article.title}
              fill
              className="object-cover"
              priority
            />
          )}

          {/* Gradient Overlay (theme-aware via CSS classes) */}
          <div className="absolute inset-0 hero-gradient-v" />
          <div className="absolute inset-0 hero-gradient-h" />

          {/* Content */}
          <div className="relative h-full flex flex-col justify-end p-6 sm:p-8 md:p-12 max-w-7xl mx-auto">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold neon-text bg-neon/10 border border-neon/20 mb-4">
                {article.category.name}
              </span>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-tight mb-3 max-w-3xl">
                {article.title}
              </h1>
              {article.summary && (
                <p className="text-sm sm:text-base text-gray-300 max-w-2xl mb-4 line-clamp-2">
                  {article.summary}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{article.readTime} menit baca</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Dots */}
      {articles.length > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
          {articles.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                index === current
                  ? 'bg-neon w-8 neon-glow'
                  : 'bg-white/20 hover:bg-white/40'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
