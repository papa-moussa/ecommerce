'use client';

import { type ProductCard as ProductCardType } from '@ecommerce/shared-types';
import { AnimatePresence, motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

import { ProductCard } from '../_components/product-card';

const QUESTIONS = [
  {
    id: 'intensity',
    question: 'Quelle intensité recherchez-vous ?',
    options: [
      { value: 'LIGHT', label: 'Léger & Discret', description: 'Idéal pour le quotidien' },
      { value: 'MODERATE', label: 'Présence Élégante', description: 'Un sillage équilibré' },
      { value: 'INTENSE', label: 'Intense & Captivant', description: 'Pour marquer les esprits' },
    ],
  },
  {
    id: 'family',
    question: 'Quelle famille olfactive vous attire le plus ?',
    options: [
      { value: 'FLORAL', label: 'Floral', description: 'Rose, jasmin, tubéreuse' },
      { value: 'WOODY', label: 'Boisé', description: 'Santal, cèdre, vétiver' },
      { value: 'ORIENTAL', label: 'Oriental', description: 'Ambre, vanille, épices' },
      { value: 'FRESH', label: 'Frais', description: 'Agrumes, notes marines' },
    ],
  },
  {
    id: 'occasion',
    question: 'Pour quelle occasion principale ?',
    options: [
      { value: 'DAILY', label: 'Quotidien', description: 'Travail et sorties simples' },
      { value: 'EVENING', label: 'Soirée', description: 'Dîners et événements' },
      { value: 'SPECIAL', label: 'Occasion Spéciale', description: 'Mariages, galas' },
    ],
  },
];

export default function QuizPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recommendations, setRecommendations] = useState<ProductCardType[]>([]);
  const [showResults, setShowResults] = useState(false);
  const router = useRouter();

  const handleOptionSelect = (option: string) => {
    const currentQuestion = QUESTIONS[step];
    if (!currentQuestion) return;

    const newAnswers = { ...answers, [currentQuestion.id]: option };
    setAnswers(newAnswers);

    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      submitQuiz(newAnswers);
    }
  };

  const submitQuiz = async (finalAnswers: Record<string, string>) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/quiz/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalAnswers),
      });
      const results = await response.json();

      // On adapte les résultats Algolia pour le ProductCard
      const adapted = (
        results as Array<{
          objectID?: string;
          id?: string;
          slug: string;
          name: string;
          brand: string;
          priceCents: number;
          currency?: string;
          stockStatus?: string;
          imageUrl?: string;
          category?: string;
        }>
      ).map((hit) => ({
        id: hit.objectID || hit.id,
        slug: hit.slug,
        name: hit.name,
        brand: hit.brand,
        priceCents: hit.priceCents,
        currency: hit.currency || 'XOF',
        stockStatus: hit.stockStatus || 'IN_STOCK',
        images: hit.imageUrl ? [{ url: hit.imageUrl, alt: hit.name }] : [],
        category: { name: hit.category || '' },
      }));

      setRecommendations(adapted.slice(0, 3) as unknown as ProductCardType[]);
      setShowResults(true);
      setIsSubmitting(false);
    } catch (error) {
      console.error('Quiz error:', error);
      setIsSubmitting(false);
    }
  };

  const progress = ((step + 1) / QUESTIONS.length) * 100;

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-brand-ivory/30 px-4 py-12">
      <div className="max-w-2xl w-full">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold font-playfair text-brand-ink mb-4">
            Trouvez votre Signature
          </h1>
          <p className="text-brand-ink/60">
            Répondez à quelques questions pour découvrir le parfum qui vous correspond.
          </p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between text-xs font-medium text-brand-gold uppercase tracking-widest mb-2">
            <span>
              Question {step + 1} sur {QUESTIONS.length}
            </span>
            <span>{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-1 bg-brand-gold/10" />
        </div>

        <AnimatePresence mode="wait">
          {!isSubmitting ? (
            (() => {
              const currentQuestion = QUESTIONS[step];
              if (!currentQuestion) return null;
              return (
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-2xl font-semibold text-brand-ink mb-8 text-center">
                    {currentQuestion.question}
                  </h2>

                  <div className="grid gap-4">
                    {currentQuestion.options.map((option) => (
                      <Card
                        key={option.value}
                        className="p-6 cursor-pointer border-brand-ink/5 hover:border-brand-gold hover:shadow-md transition-all group"
                        onClick={() => handleOptionSelect(option.value)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-brand-ink group-hover:text-brand-gold transition-colors">
                              {option.label}
                            </h3>
                            <p className="text-sm text-brand-ink/60">{option.description}</p>
                          </div>
                          <div className="w-6 h-6 rounded-full border-2 border-brand-ink/10 flex items-center justify-center group-hover:border-brand-gold">
                            <div className="w-2.5 h-2.5 rounded-full bg-brand-gold scale-0 group-hover:scale-100 transition-transform" />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {step > 0 && (
                    <button
                      onClick={() => setStep(step - 1)}
                      className="mt-8 text-sm text-brand-ink/40 hover:text-brand-ink transition-colors flex items-center gap-2 mx-auto"
                    >
                      ← Question précédente
                    </button>
                  )}
                </motion.div>
              );
            })()
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <div className="inline-block w-12 h-12 border-4 border-brand-gold border-t-transparent rounded-full animate-spin mb-6" />
              <h2 className="text-2xl font-semibold text-brand-ink mb-2 italic">
                Analyse de vos préférences...
              </h2>
              <p className="text-brand-ink/60">Nous sélectionnons vos futurs favoris.</p>
            </motion.div>
          )}
        </AnimatePresence>

        <Dialog
          isOpen={showResults}
          onClose={() => setShowResults(false)}
          title="Vos Coups de Cœur Olfactifs"
        >
          <div className="space-y-10 text-center">
            <p className="text-brand-ink/60 max-w-md mx-auto">
              Voici les 3 fragrances qui résonnent le mieux avec votre personnalité et vos envies du
              moment.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {recommendations.map((product) => (
                <div key={product.id} className="text-left">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button
                onClick={() => router.push('/produits')}
                className="w-full sm:w-auto h-12 px-8"
              >
                Voir tout le catalogue
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowResults(false);
                  setStep(0);
                  setAnswers({});
                }}
                className="w-full sm:w-auto h-12 px-8"
              >
                Refaire le quiz
              </Button>
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
}
