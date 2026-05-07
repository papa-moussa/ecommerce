import { Sparkles } from 'lucide-react';
import Link from 'next/link';

export function QuizTeaser() {
  return (
    <section className="bg-white text-brand-ink py-24 relative overflow-hidden border-b border-brand-gold/10">
      <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 rounded-full bg-brand-gold/10 flex items-center justify-center border border-brand-gold/20">
            <Sparkles className="w-5 h-5 text-brand-gold" strokeWidth={1.5} />
          </div>
        </div>

        <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-6 text-brand-ink">
          Quelle est votre signature olfactive ?
        </h2>

        <p className="text-brand-ink/60 md:text-lg mb-12 max-w-xl mx-auto leading-relaxed">
          Découvrez les fragrances qui résonnent avec votre personnalité. Laissez notre nez virtuel
          analyser vos préférences et vous suggérer une sélection sur-mesure.
        </p>

        <Link
          href="/quiz"
          className="inline-flex items-center gap-4 bg-brand-ink text-brand-ivory hover:bg-brand-gold hover:text-brand-ink transition-all duration-300 px-8 py-4 rounded-full text-xs font-bold uppercase tracking-[0.2em] shadow-xl shadow-brand-ink/5"
        >
          Faire le Diagnostic
          <span className="w-6 h-px bg-current"></span>
        </Link>
      </div>
    </section>
  );
}
