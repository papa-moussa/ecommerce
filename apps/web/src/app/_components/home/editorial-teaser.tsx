import Link from 'next/link';

export function EditorialTeaser() {
  return (
    <section className="bg-white py-12 md:py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-24 items-center">
          {/* Image side */}
          <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=1000"
              alt="Atelier de parfumerie"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-brand-ink/10"></div>
          </div>

          {/* Text side */}
          <div className="flex flex-col justify-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold mb-6 block">
              Le savoir-faire
            </span>
            <h2 className="font-serif text-5xl md:text-6xl lg:text-7xl text-brand-ink mb-8 leading-[1.1]">
              L'Art de la
              <br />
              Parfumerie
            </h2>

            <div className="w-16 h-px bg-brand-gold/30 mb-8"></div>

            <p className="text-brand-ink/70 leading-relaxed mb-6 text-lg">
              Devenez un initié. Explorez les mystères de la pyramide olfactive, apprenez à
              déchiffrer les familles de parfums et comprenez les nuances des différentes
              concentrations.
            </p>
            <p className="text-brand-ink/50 leading-relaxed mb-12 text-sm italic">
              Un voyage au cœur de la création, pour mieux choisir le parfum qui racontera votre
              histoire.
            </p>

            <Link
              href="/univers/notes"
              className="inline-flex items-center gap-4 text-xs font-bold uppercase tracking-[0.2em] text-brand-ink hover:text-brand-gold transition-colors w-max group"
            >
              Comprendre les notes
              <span className="w-8 h-px bg-current transition-all group-hover:w-12"></span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
