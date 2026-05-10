'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { Eye, Clock, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

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

interface NewsCardProps {
  article: Article;
  variant?: 'default' | 'featured';
  index?: number;
  onClick?: (article: Article) => void;
}

export default function NewsCard({
  article,
  variant = 'default',
  index = 0,
  onClick,
}: NewsCardProps) {
  const timeAgo = formatDistanceToNow(new Date(article.createdAt), {
    addSuffix: true,
    locale: localeId,
  });

  if (variant === 'featured') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        whileHover={{ scale: 1.01 }}
        onClick={() => onClick?.(article)}
        className="glass-card glass-hover cursor-pointer overflow-hidden col-span-1 md:col-span-2"
      >
        <div className="flex flex-col md:flex-row h-full">
          {/* Image */}
          <div className="relative w-full md:w-1/2 h-64 md:h-auto min-h-[250px] shrink-0">
            {article.imageUrl ? (
              <Image
                src={article.imageUrl}
                alt={article.title}
                fill
                className="object-cover"
              />
            ) : (
              <Image
                src="/images/articles/default.jpg"
                alt={article.title}
                fill
                className="object-cover"
              />
            )}
          </div>

          {/* Content */}
          <div className="flex flex-col justify-center p-5 md:p-6 flex-1">
            <span className="inline-block self-start px-2.5 py-0.5 rounded-full text-xs font-bold neon-text bg-neon/10 border border-neon/20 mb-3">
              {article.category.name}
            </span>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2 line-clamp-2 leading-tight">
              {article.title}
            </h2>
            {article.summary && (
              <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                {article.summary}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-auto">
              <span className="font-medium text-gray-300">
                {article.author.username}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {timeAgo}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {article.readTime} min
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {article.viewCount}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ scale: 1.02 }}
      onClick={() => onClick?.(article)}
      className="glass-card glass-hover cursor-pointer overflow-hidden flex flex-col"
    >
      {/* Image */}
      <div className="relative w-full h-48 shrink-0">
        {article.imageUrl ? (
          <Image
            src={article.imageUrl}
            alt={article.title}
            fill
            className="object-cover"
          />
        ) : (
          <Image
            src="/images/articles/default.jpg"
            alt={article.title}
            fill
            className="object-cover"
          />
        )}
        <div className="absolute top-3 left-3">
          <span className="px-2 py-0.5 rounded-full text-xs font-bold neon-text bg-deep-900/80 backdrop-blur-sm border border-neon/20">
            {article.category.name}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <h3 className="text-base font-bold text-white mb-2 line-clamp-2 leading-snug">
          {article.title}
        </h3>
        {article.summary && (
          <p className="text-sm text-gray-400 mb-3 line-clamp-2 flex-1">
            {article.summary}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-gray-500 mt-auto pt-3 border-t border-white/5">
          <span className="font-medium text-gray-300">
            {article.author.username}
          </span>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {timeAgo}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {article.viewCount}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {article.readTime}m
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
