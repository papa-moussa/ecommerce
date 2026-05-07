import Link from 'next/link';

import { OlfactoryFamilies } from './_components/olfactory-families';

export default function NotesPage() {
  return (
    <div className="bg-brand-ivory min-h-screen">
      {/* Hero Section */}
      <section className="relative px-4 py-32 md:py-48 flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Subtle background decorative element */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border-[0.5px] border-brand-gold/10 opacity-50 blur-3xl pointer-events-none"></div>

        <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.3em] text-brand-gold mb-6 md:mb-8 block">
          L'Art & La Matière
        </span>
        <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl text-brand-ink mb-8 md:mb-10 max-w-5xl leading-tight">
          L'essence de la <br /> <span className="italic text-brand-ink/80">haute parfumerie.</span>
        </h1>
        <p className="text-brand-ink/60 max-w-2xl mx-auto text-sm md:text-base leading-relaxed md:leading-loose">
          Bien plus qu'une simple fragrance, un parfum de luxe est une œuvre d'art invisible. C'est
          un voyage olfactif méticuleusement chorégraphié, tissé de souvenirs, d'émotions et des
          matières premières les plus rares au monde.
        </p>
      </section>

      {/* Introduction to Luxury Perfumery */}
      <section className="max-w-4xl mx-auto px-6 py-20 md:py-32">
        <div className="flex flex-col md:flex-row gap-12 md:gap-24 items-start">
          <h2 className="font-serif text-3xl md:text-5xl text-brand-ink flex-shrink-0 md:w-1/3 leading-snug">
            Le Savoir-
            <br />
            Faire.
          </h2>
          <div className="flex-1 space-y-8 text-brand-ink/70 leading-relaxed text-sm md:text-base">
            <p>
              La parfumerie de luxe se distingue par son refus du compromis. Là où la parfumerie de
              masse cherche l'immédiateté, la haute parfumerie exige le temps. Le temps de sourcer
              l'absolue de rose de Grasse à l'aube, le temps de laisser macérer les essences, et
              surtout, le temps de la création.
            </p>
            <p>
              Le « Nez », véritable compositeur, orchestre des centaines de notes pour créer un
              accord parfait. Chaque goutte raconte une histoire d'artisanat, de rareté et de
              passion, transformant des ingrédients précieux en une signature invisible et
              inoubliable qui devient la vôtre.
            </p>
          </div>
        </div>
      </section>

      <hr className="border-t border-brand-gold/20 max-w-6xl mx-auto" />

      {/* The Olfactory Pyramid (Editorial Layout) */}
      <section className="max-w-5xl mx-auto px-6 py-24 md:py-40">
        <div className="text-center mb-24">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold mb-4 block">
            Architecture d'une Fragrance
          </span>
          <h2 className="font-serif text-4xl md:text-5xl text-brand-ink">La Pyramide Olfactive</h2>
        </div>

        <div className="space-y-32">
          {/* Notes de Tête */}
          <div className="flex flex-col md:flex-row gap-12 items-center group">
            <div className="md:w-1/3 text-center md:text-right">
              <span className="font-serif text-7xl md:text-8xl text-brand-gold/10 group-hover:text-brand-gold/20 transition-colors duration-700">
                01
              </span>
            </div>
            <div className="md:w-2/3 md:pl-12 border-t md:border-t-0 md:border-l border-brand-gold/20 pt-8 md:pt-0">
              <h3 className="font-serif text-3xl text-brand-ink mb-2">Les Notes de Tête</h3>
              <span className="text-xs uppercase tracking-widest text-brand-gold mb-6 block">
                L'Envolée (0 - 15 min)
              </span>
              <p className="text-brand-ink/60 leading-relaxed mb-6">
                Le prélude du parfum. Éphémères, volatiles et incisives, ces notes créent la
                première impression. Elles doivent captiver immédiatement avant de s'évaporer
                gracieusement pour laisser place au cœur de la composition.
              </p>
              <p className="text-xs font-medium text-brand-ink/40 tracking-wide">
                MATIÈRES PRIVILÉGIÉES : Bergamote, Citron, Néroli, Baies roses, Menthe.
              </p>
            </div>
          </div>

          {/* Notes de Coeur */}
          <div className="flex flex-col md:flex-row gap-12 items-center group">
            <div className="md:w-1/3 text-center md:text-right">
              <span className="font-serif text-7xl md:text-8xl text-brand-gold/10 group-hover:text-brand-gold/20 transition-colors duration-700">
                02
              </span>
            </div>
            <div className="md:w-2/3 md:pl-12 border-t md:border-t-0 md:border-l border-brand-gold/20 pt-8 md:pt-0">
              <h3 className="font-serif text-3xl text-brand-ink mb-2">Les Notes de Cœur</h3>
              <span className="text-xs uppercase tracking-widest text-brand-gold mb-6 block">
                Le Caractère (15 min - 4h)
              </span>
              <p className="text-brand-ink/60 leading-relaxed mb-6">
                L'âme véritable de la fragrance. Une fois les notes de tête dissipées, le cœur se
                déploie. Il donne au parfum son thème principal, sa rondeur et sa véritable
                personnalité olfactive. C'est le sillage que l'on remarque au cours de la journée.
              </p>
              <p className="text-xs font-medium text-brand-ink/40 tracking-wide">
                MATIÈRES PRIVILÉGIÉES : Jasmin de Grasse, Rose Damascena, Tubéreuse, Épices douces.
              </p>
            </div>
          </div>

          {/* Notes de Fond */}
          <div className="flex flex-col md:flex-row gap-12 items-center group">
            <div className="md:w-1/3 text-center md:text-right">
              <span className="font-serif text-7xl md:text-8xl text-brand-gold/10 group-hover:text-brand-gold/20 transition-colors duration-700">
                03
              </span>
            </div>
            <div className="md:w-2/3 md:pl-12 border-t md:border-t-0 md:border-l border-brand-gold/20 pt-8 md:pt-0">
              <h3 className="font-serif text-3xl text-brand-ink mb-2">Les Notes de Fond</h3>
              <span className="text-xs uppercase tracking-widest text-brand-gold mb-6 block">
                La Signature (4h - Plusieurs jours)
              </span>
              <p className="text-brand-ink/60 leading-relaxed mb-6">
                L'empreinte indélébile. Les molécules les plus lourdes s'installent durablement sur
                la peau et les vêtements. Elles fixent le parfum, lui donnent de la profondeur et
                créent cet attachement intime. C'est le souvenir qui reste après votre départ.
              </p>
              <p className="text-xs font-medium text-brand-ink/40 tracking-wide">
                MATIÈRES PRIVILÉGIÉES : Bois de Santal, Oud, Musc, Ambre, Vanille de Madagascar.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* NEW SECTION: Familles Olfactives */}
      <OlfactoryFamilies />

      <div className="bg-brand-ink text-brand-ivory py-24 md:py-40">
        <section className="max-w-4xl mx-auto px-6 text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold mb-6 block">
            L'Intensité
          </span>
          <h2 className="font-serif text-4xl md:text-5xl mb-16">Le Choix de la Concentration</h2>

          <div className="space-y-16 text-left">
            <div className="flex justify-between items-end border-b border-brand-ivory/10 pb-6">
              <div>
                <h4 className="text-xl md:text-2xl font-serif text-white mb-2">Eau de Toilette</h4>
                <p className="text-brand-ivory/60 text-sm md:text-base max-w-xl">
                  Légère et lumineuse. Idéale pour le matin, l'été, ou un sillage discret. Elle
                  privilégie souvent les notes de tête.
                </p>
              </div>
              <span className="text-brand-gold text-sm tracking-widest font-medium hidden md:block">
                5% - 15%
              </span>
            </div>

            <div className="flex justify-between items-end border-b border-brand-ivory/10 pb-6">
              <div>
                <h4 className="text-xl md:text-2xl font-serif text-white mb-2">Eau de Parfum</h4>
                <p className="text-brand-ivory/60 text-sm md:text-base max-w-xl">
                  Intense et enveloppante. Le parfait équilibre pour une tenue remarquable tout au
                  long de la journée.
                </p>
              </div>
              <span className="text-brand-gold text-sm tracking-widest font-medium hidden md:block">
                15% - 20%
              </span>
            </div>

            <div className="flex justify-between items-end border-b border-brand-ivory/10 pb-6">
              <div>
                <h4 className="text-xl md:text-2xl font-serif text-white mb-2">
                  Extrait de Parfum
                </h4>
                <p className="text-brand-ivory/60 text-sm md:text-base max-w-xl">
                  L'élixir absolu. Une ou deux gouttes suffisent. Une composition majestueuse qui
                  sublime les notes de fond avec une tenue exceptionnelle.
                </p>
              </div>
              <span className="text-brand-gold text-sm tracking-widest font-medium hidden md:block">
                20% - 40%
              </span>
            </div>
          </div>
        </section>
      </div>

      {/* Refined Call to Action */}
      <section className="py-32 md:py-48 text-center px-4">
        <h2 className="font-serif text-3xl md:text-5xl text-brand-ink mb-6 italic">
          Trouvez votre Signature
        </h2>
        <p className="text-brand-ink/60 max-w-lg mx-auto mb-12 text-sm leading-relaxed">
          Maintenant que vous maîtrisez le langage des parfums, laissez notre expertise vous guider
          vers la création qui résonnera avec votre personnalité.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <Link
            href="/produits"
            className="px-8 py-4 bg-brand-ink text-brand-ivory text-xs font-bold uppercase tracking-[0.2em] hover:bg-brand-gold transition-colors duration-300 w-full sm:w-auto"
          >
            Explorer la Collection
          </Link>
          <Link
            href="/quiz"
            className="px-8 py-4 bg-transparent border border-brand-ink text-brand-ink text-xs font-bold uppercase tracking-[0.2em] hover:bg-brand-ink hover:text-brand-ivory transition-colors duration-300 w-full sm:w-auto"
          >
            Lancer l'Expérience Quiz
          </Link>
        </div>
      </section>
    </div>
  );
}
