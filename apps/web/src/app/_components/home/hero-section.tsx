import Link from 'next/link';

export function HeroSection() {
  return (
    <section className="relative h-[85vh] min-h-[600px] flex items-center justify-center overflow-hidden">
      {/* Background Image with Dark Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&q=80&w=2000"
          alt="Parfumerie de luxe"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/70 to-[#080808]/30"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto mt-20">
        <span className="inline-block mb-6 text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] text-brand-gold">
          Haute Parfumerie
        </span>
        <h1 className="mb-8 font-serif text-5xl md:text-7xl lg:text-8xl text-white/95 leading-[1.1]">
          L'Élégance de la <br /> Signature Olfactive
        </h1>
        <p className="mx-auto mb-12 max-w-lg text-sm md:text-base leading-relaxed text-white/60">
          Une sélection rigoureuse de parfums de niche et créations indépendantes, cueillis aux
          quatre coins du monde olfactif.
        </p>
        <Link
          href="/produits"
          className="inline-block bg-brand-gold/10 backdrop-blur-sm border border-brand-gold text-brand-gold hover:bg-brand-gold hover:text-brand-ink transition-all duration-500 px-10 py-4 text-xs font-bold uppercase tracking-[0.2em]"
        >
          Découvrir la Collection
        </Link>
      </div>
    </section>
  );
}
