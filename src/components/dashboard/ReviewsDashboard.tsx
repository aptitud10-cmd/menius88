'use client';

import { useState, useEffect } from 'react';
import {
  Star, Eye, EyeOff, Trash2, MessageSquare, TrendingUp, User,
} from 'lucide-react';
import { cn, timeAgo } from '@/lib/utils';

interface Review {
  id: string;
  customer_name: string;
  rating: number;
  comment: string;
  is_visible: boolean;
  created_at: string;
  order_id: string | null;
}

interface Stats {
  total: number;
  visible: number;
  average: number;
  distribution: number[];
}

export function ReviewsDashboard() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, visible: 0, average: 0, distribution: [0, 0, 0, 0, 0] });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all');

  const fetchReviews = async () => {
    try {
      const res = await fetch('/api/tenant/reviews');
      if (res.ok) {
        const data = await res.json();
        setReviews(data.reviews ?? []);
        setStats(data.stats ?? { total: 0, visible: 0, average: 0, distribution: [0, 0, 0, 0, 0] });
      }
    } catch { /* silent */ }
    setLoading(false);
  };

  useEffect(() => { fetchReviews(); }, []);

  const handleToggleVisibility = async (review: Review) => {
    await fetch('/api/tenant/reviews', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: review.id, is_visible: !review.is_visible }),
    });
    setReviews(prev => prev.map(r => r.id === review.id ? { ...r, is_visible: !r.is_visible } : r));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta reseña permanentemente?')) return;
    await fetch(`/api/tenant/reviews?id=${id}`, { method: 'DELETE' });
    setReviews(prev => prev.filter(r => r.id !== id));
  };

  const filtered = filter === 'all' ? reviews : reviews.filter(r => r.rating === parseInt(filter));

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-2xl" />
          ))}
        </div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-white rounded-xl border border-gray-100" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
              <Star className="w-4 h-4 text-amber-500" />
            </div>
            <span className="text-xs text-gray-400 font-medium">Calificación</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.average || '—'}<span className="text-sm font-normal text-gray-400"> / 5</span></p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-xs text-gray-400 font-medium">Total</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-xs text-gray-400 font-medium">Visibles</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.visible}</p>
        </div>
      </div>

      {/* Rating distribution */}
      {stats.total > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Distribución</h3>
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map(star => {
              const count = stats.distribution[star - 1];
              const pct = stats.total > 0 ? (count / stats.total) * 100 : 0;
              return (
                <button
                  key={star}
                  onClick={() => setFilter(filter === String(star) ? 'all' : String(star) as any)}
                  className={cn(
                    'flex items-center gap-2 w-full rounded-lg px-2 py-1 transition-colors',
                    filter === String(star) ? 'bg-amber-50' : 'hover:bg-gray-50'
                  )}
                >
                  <span className="text-xs font-medium text-gray-600 w-4">{star}</span>
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 w-6 text-right">{count}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter info */}
      {filter !== 'all' && (
        <div className="flex items-center justify-between bg-amber-50 rounded-xl px-4 py-2">
          <span className="text-xs text-amber-700 font-medium">
            Mostrando reseñas de {filter} ★ ({filtered.length})
          </span>
          <button onClick={() => setFilter('all')} className="text-xs text-amber-700 hover:text-amber-900 font-semibold">
            Ver todas
          </button>
        </div>
      )}

      {/* Reviews list */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin reseñas</p>
          <p className="text-sm mt-1 text-gray-300">Las reseñas de tus clientes aparecerán aquí</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(review => (
            <div
              key={review.id}
              className={cn(
                'bg-white rounded-xl border px-4 py-3.5 transition-all',
                review.is_visible ? 'border-gray-100' : 'border-gray-100 opacity-50'
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-semibold text-gray-900">{review.customer_name}</span>
                    <span className="text-[10px] text-gray-400">{timeAgo(review.created_at)}</span>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-0.5 mb-1.5">
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star
                        key={s}
                        className={cn(
                          'w-3.5 h-3.5',
                          s <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'
                        )}
                      />
                    ))}
                  </div>

                  {review.comment && (
                    <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
                  )}
                </div>

                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => handleToggleVisibility(review)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
                    title={review.is_visible ? 'Ocultar' : 'Mostrar'}
                  >
                    {review.is_visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => handleDelete(review.id)}
                    className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
