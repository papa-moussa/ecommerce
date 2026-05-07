'use client';

import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { AlertCircle, CheckCircle, MessageSquare, Star } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { clientApi } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cn } from '@/lib/utils';

interface Review {
  id: string;
  rating: number;
  title?: string;
  comment: string;
  createdAt: string;
  user: { firstName: string; lastName: string };
}

interface ReviewsResponse {
  items: Review[];
  total: number;
  avgRating: number;
}

export function ProductReviews({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadReviews() {
      try {
        const data = await clientApi.reviews.listByProduct(productId);
        setReviews(data as ReviewsResponse);
      } catch (err) {
        console.error('Failed to load reviews', err);
      } finally {
        setLoading(false);
      }
    }
    loadReviews();
  }, [productId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      await clientApi.reviews.create(productId, { rating, title, comment });
      setSuccess(true);
      setShowForm(false);
      // On pourrait recharger, mais l'avis est en attente de modération
    } catch (err) {
      setError((err as Error).message || "Une erreur est survenue lors du dépôt de l'avis.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) return <div className="h-40 animate-pulse bg-brand-ivory/20 rounded-3xl" />;

  const avg = reviews?.avgRating || 0;
  const total = reviews?.total || 0;

  return (
    <div className="mt-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h2 className="text-3xl font-playfair font-bold text-brand-ink mb-2">Avis des clients</h2>
          <div className="flex items-center gap-4">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={20}
                  className={cn(
                    'fill-current transition-colors',
                    i <= Math.round(avg) ? 'text-brand-gold' : 'text-brand-ink/10',
                  )}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-brand-ink/60">
              {total} {total > 1 ? 'avis' : 'avis'} — {avg.toFixed(1)}/5
            </span>
          </div>
        </div>

        {user && !success && (
          <Button onClick={() => setShowForm(!showForm)} variant={showForm ? 'outline' : 'primary'}>
            {showForm ? 'Annuler' : 'Laisser un avis'}
          </Button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mb-12 p-8 bg-brand-ivory/30 rounded-[2rem] border border-brand-gold/10 max-w-2xl"
        >
          <h3 className="text-xl font-playfair font-semibold text-brand-ink mb-6">
            Partagez votre expérience
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-brand-ink/40 mb-3">
                Note
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setRating(i)}
                    className="focus:outline-none transition-transform hover:scale-110"
                  >
                    <Star
                      size={32}
                      className={cn(
                        'fill-current',
                        i <= rating ? 'text-brand-gold' : 'text-brand-ink/10',
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-brand-ink/40 mb-2">
                Titre (optionnel)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="En quelques mots..."
                className="w-full bg-white border border-brand-ink/10 rounded-xl px-4 py-3 text-sm focus:border-brand-gold focus:ring-0 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-brand-ink/40 mb-2">
                Votre avis
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                required
                rows={4}
                placeholder="Racontez-nous ce que vous avez aimé..."
                className="w-full bg-white border border-brand-ink/10 rounded-xl px-4 py-3 text-sm focus:border-brand-gold focus:ring-0 transition-colors"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-4 rounded-xl text-sm">
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <Button type="submit" disabled={isSubmitting} className="w-full h-12">
              {isSubmitting ? 'Envoi en cours...' : 'Publier mon avis'}
            </Button>
          </div>
        </form>
      )}

      {success && (
        <div className="mb-12 p-8 bg-green-50 rounded-[2rem] border border-green-100 flex flex-col items-center text-center">
          <div className="h-12 w-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center mb-4 text-2xl">
            ✓
          </div>
          <h3 className="text-xl font-playfair font-semibold text-brand-ink mb-2">
            Merci pour votre avis !
          </h3>
          <p className="text-sm text-brand-ink/60">
            Votre commentaire a été envoyé pour modération et sera visible très prochainement.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {(reviews?.items || []).map((review) => (
          <div
            key={review.id}
            className="p-8 bg-white border border-brand-ink/5 rounded-[2rem] shadow-sm flex flex-col h-full"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={14}
                    className={cn(
                      'fill-current',
                      i <= review.rating ? 'text-brand-gold' : 'text-brand-ink/10',
                    )}
                  />
                ))}
              </div>
              <span className="text-[10px] text-brand-ink/30 font-bold uppercase tracking-widest">
                {format(new Date(review.createdAt), 'dd MMM yyyy', { locale: fr })}
              </span>
            </div>

            {review.title && <h4 className="font-semibold text-brand-ink mb-2">{review.title}</h4>}

            <p className="text-sm text-brand-ink/70 leading-relaxed mb-6 flex-grow">
              « {review.comment} »
            </p>

            <div className="flex items-center gap-3 pt-6 border-t border-brand-ink/5">
              <div className="h-8 w-8 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold font-bold text-xs">
                {review.user.firstName[0]}
                {review.user.lastName[0]}
              </div>
              <div>
                <p className="text-xs font-bold text-brand-ink">
                  {review.user.firstName} {review.user.lastName}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-green-600 font-bold uppercase tracking-widest">
                  <CheckCircle size={10} />
                  Achat vérifié
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {total === 0 && !showForm && (
        <div className="py-20 text-center bg-brand-ivory/10 rounded-[2rem] border-2 border-dashed border-brand-ink/5">
          <MessageSquare className="mx-auto text-brand-ink/10 mb-4" size={40} />
          <p className="text-brand-ink/40">Soyez le premier à laisser un avis sur ce parfum.</p>
        </div>
      )}
    </div>
  );
}
