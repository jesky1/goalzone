'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Sparkles,
  Eye,
  Clock,
  Calendar,
  Send,
  User,
  Loader2,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import GoogleNewsSchema from '@/components/football/GoogleNewsSchema';

interface Article {
  id: string;
  title: string;
  slug: string;
  content?: string;
  summary: string | null;
  imageUrl: string | null;
  category: { name: string; slug: string };
  author: { username: string };
  viewCount: number;
  readTime: number;
  createdAt: string;
}

interface Comment {
  id: string;
  text: string;
  user: { username: string };
  createdAt: string;
}

interface ArticleModalProps {
  article: Article | null;
  open: boolean;
  onClose: () => void;
}

export default function ArticleModal({
  article,
  open,
  onClose,
}: ArticleModalProps) {
  const [fullArticle, setFullArticle] = useState<Article | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadCommentsRef = useRef<() => void>();

  useEffect(() => {
    let cancelled = false;

    if (open && article) {
      setCommentText('');

      const loadArticle = async () => {
        try {
          const res = await fetch(`/api/articles/${article.slug}`);
          if (res.ok && !cancelled) {
            const data = await res.json();
            setFullArticle(data);
          }
        } catch {
          if (!cancelled) setFullArticle(article);
        }
      };

      const loadComments = async () => {
        try {
          const res = await fetch(`/api/articles/${article.slug}/comments`);
          if (res.ok && !cancelled) {
            const data = await res.json();
            const list = data.comments || [];
            if (Array.isArray(list)) {
              setComments(list);
            }
          }
        } catch {
          // silently fail
        }
      };

      loadArticle();
      loadComments();
      loadCommentsRef.current = loadComments;
    }

    if (!open) {
      setFullArticle(null);
      setComments([]);
    }

    return () => {
      cancelled = true;
    };
  }, [open, article]);

  const handleSubmitComment = async () => {
    if (!article || !commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/articles/${article.slug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'demo-user', text: commentText.trim() }),
      });
      if (res.ok) {
        setCommentText('');
        loadCommentsRef.current?.();
      }
    } catch {
      // silently fail
    } finally {
      setSubmitting(false);
    }
  };

  const displayArticle = fullArticle || article;

  // Build schema-extended article for Google News JSON-LD
  const schemaArticle = displayArticle
    ? {
        title: displayArticle.title,
        slug: displayArticle.slug,
        content: fullArticle?.content || displayArticle.content,
        summary: displayArticle.summary,
        imageUrl: displayArticle.imageUrl,
        categoryName: displayArticle.category.name,
        authorName: displayArticle.author.username,
        readTime: displayArticle.readTime,
        publishedAt: (fullArticle as any)?.publishedAt || displayArticle.createdAt,
        updatedAt: (fullArticle as any)?.updatedAt,
        createdAt: displayArticle.createdAt,
      }
    : null;

  return (
    <>
      {/* JSON-LD structured data for Google News & Discover */}
      <GoogleNewsSchema article={schemaArticle} />

      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar bg-deep-800 border-white/10 p-0">
        <AnimatePresence>
          {displayArticle && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Hero Image */}
              <div className="relative w-full h-64 sm:h-80">
                {displayArticle.imageUrl && (
                  <Image
                    src={displayArticle.imageUrl}
                    alt={displayArticle.title}
                    fill
                    className="object-cover"
                  />
                )}
                {!displayArticle.imageUrl && (
                  <div className="absolute inset-0 bg-gradient-to-br from-deep-700 to-deep-900 flex items-center justify-center">
                    <span className="text-6xl text-white/10">⚽</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-deep-800 via-transparent to-transparent" />
              </div>

              {/* Content */}
              <div className="p-5 sm:p-6 -mt-8 relative">
                <DialogHeader className="mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-neon/10 text-neon border-neon/20 hover:bg-neon/20 text-xs font-bold">
                      {displayArticle.category.name}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="bg-white/5 text-muted-foreground text-xs"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      {displayArticle.viewCount} views
                    </Badge>
                  </div>
                  <DialogTitle className="text-xl sm:text-2xl font-bold text-white leading-tight">
                    {displayArticle.title}
                  </DialogTitle>
                </DialogHeader>

                {/* Meta */}
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-5">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {displayArticle.author.username}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDistanceToNow(new Date(displayArticle.createdAt), {
                      addSuffix: true,
                      locale: localeId,
                    })}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {displayArticle.readTime} menit baca
                  </span>
                </div>

                {/* AI Summary */}
                {displayArticle.summary && (
                  <div className="glass-card p-4 mb-6 border-neon/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="w-4 h-4 text-neon" />
                      <span className="text-xs font-bold neon-text">
                        AI Summary
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {displayArticle.summary}
                    </p>
                  </div>
                )}

                {/* Article Content */}
                {(fullArticle?.content || displayArticle.content) && (
                  <div
                    className="prose prose-invert prose-sm max-w-none mb-6 text-sm sm:text-base text-gray-300 leading-relaxed [&_p]:mb-4"
                    dangerouslySetInnerHTML={{
                      __html: fullArticle?.content || displayArticle.content || '',
                    }}
                  />
                )}

                {/* No Content Fallback */}
                {!fullArticle?.content && !displayArticle.content && (
                  <p className="text-sm text-muted-foreground mb-6 italic">
                    Konten lengkap sedang dimuat...
                  </p>
                )}

                <Separator className="bg-white/5 my-6" />

                {/* Comments Section */}
                <div>
                  <h4 className="text-base font-bold text-white mb-4">
                    Komentar ({comments.length})
                  </h4>

                  {/* Comment Input */}
                  <div className="flex gap-3 mb-6">
                    <Textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Tulis komentar..."
                      className="min-h-[80px] bg-white/5 border-white/10 text-sm placeholder:text-muted-foreground focus:border-neon/30 focus:ring-neon/20 resize-none"
                      rows={3}
                    />
                    <Button
                      onClick={handleSubmitComment}
                      disabled={!commentText.trim() || submitting}
                      size="sm"
                      className="self-end bg-neon/10 text-neon hover:bg-neon/20 border border-neon/20 shrink-0"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Send className="w-4 h-4" />
                      )}
                    </Button>
                  </div>

                  {/* Comments List */}
                  <div className="space-y-4">
                    {comments.map((comment) => (
                      <motion.div
                        key={comment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass p-3 rounded-lg"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-sm font-medium text-white">
                            {comment.user.username}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(
                              new Date(comment.createdAt),
                              {
                                addSuffix: true,
                                locale: localeId,
                              }
                            )}
                          </span>
                        </div>
                        <p className="text-sm text-gray-300">{comment.text}</p>
                      </motion.div>
                    ))}

                    {comments.length === 0 && (
                      <p className="text-center text-xs text-muted-foreground py-6">
                        Belum ada komentar. Jadilah yang pertama berkomentar!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
    </>
  );
}
