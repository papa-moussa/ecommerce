'use client';

import { cn } from '@ecommerce/ui';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

const FAMILIES = [
  {
    id: 'oriental',
    name: 'Oriental',
    subtitle: "L'Envoûtement des Sens",
    description:
      "La famille orientale incarne l'opulence et la sensualité. Héritière des routes de la soie et des bazars d'Orient, elle marie les résines précieuses aux épices chaudes pour créer des sillages enveloppants et mystérieux. Ces parfums évoquent les nuits d'ambre, les rituels d'encens et la douceur des palais orientaux.",
    creationsCount: 14,
    accords: ['AMBRE', 'OUD', 'ENCENS', 'MUSC', 'VANILLE', 'BENJOIN', 'LABDANUM', 'SANTAL'],
    construction:
      "Les orientaux se construisent autour d'un cœur ambré et résineux, souvent relevé par des épices (cannelle, cardamome, safran) et adouci par des notes vanillées ou balsamiques. Le fond, puissant et tenace, repose sur le oud, le musc et les bois précieux.",
    imageUrl:
      'https://images.unsplash.com/photo-1615529182904-14819c35db37?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'boise',
    name: 'Boisé',
    subtitle: 'La Force de la Nature',
    description:
      "Chaleureux, opulents ou secs, les parfums boisés tirent leur caractère des essences d'arbres. Ils apportent structure, élégance et une masculinité assumée qui séduit de plus en plus la parfumerie féminine.",
    creationsCount: 12,
    accords: ['CÈDRE', 'VÉTIVER', 'PATCHOULI', 'SANTAL', 'GAÏAC'],
    construction:
      'Souvent placés en note de fond pour leur excellente tenue, les bois charpentent le parfum. Ils peuvent être secs (cèdre), humides (vétiver), fumés (gaïac) ou crémeux (santal).',
    imageUrl:
      'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'fruite',
    name: 'Fruité',
    subtitle: 'Le Verger Gorgé de Soleil',
    description:
      'Des notes croquantes, juteuses et sucrées qui apportent une dimension joyeuse et pétillante. Pêche, prune, fruits rouges ou exotiques égayent les compositions.',
    creationsCount: 8,
    accords: ['PÊCHE', 'PRUNE', 'CASSIS', 'FIGUE', 'MÛRE'],
    construction:
      "Les notes fruitées s'associent merveilleusement aux fleurs pour créer des floraux-fruités, apportant velouté et gourmandise sans tomber dans l'excès de sucre.",
    imageUrl:
      'https://images.unsplash.com/photo-1610832958506-aa56368176cf?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'floral',
    name: 'Floral',
    subtitle: "L'Éclosion Majestueuse",
    description:
      "La famille la plus vaste et la plus ancienne. De l'innocence du muguet à la charnalité de la tubéreuse, la fleur offre une palette infinie d'expressions olfactives.",
    creationsCount: 24,
    accords: ['ROSE', 'JASMIN', 'TUBÉREUSE', 'YLANG-YLANG', 'IRIS'],
    construction:
      "Le cœur du parfum est presque toujours floral. Il peut s'agir d'un soliflore (une seule fleur) ou d'un bouquet complexe mariant fleurs blanches, roses et fleurs poudrées.",
    imageUrl:
      'https://images.unsplash.com/photo-1554631221-f9603e6808be?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'gourmand',
    name: 'Gourmand',
    subtitle: 'La Tentation Addictive',
    description:
      "Des notes régressives et appétissantes qui éveillent les souvenirs d'enfance. Vanille, caramel, praline, chocolat créent des sillages addictifs et réconfortants.",
    creationsCount: 6,
    accords: ['VANILLE', 'CARAMEL', 'CACAO', 'CAFÉ', 'FÈVE TONKA'],
    construction:
      "Souvent construits sur une base orientale, les gourmands poussent les facettes sucrées et balsamiques à l'extrême, créant une véritable addiction olfactive.",
    imageUrl:
      'https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'frais',
    name: 'Frais',
    subtitle: 'Le Souffle Cristallin',
    description:
      "Agrumes, notes aquatiques ou aldéhydes apportent une sensation de propreté, d'air vif et d'eau glacée. Une pureté revigorante idéale pour les journées chaudes.",
    creationsCount: 10,
    accords: ['CITRON', 'BERGAMOTE', 'CALONE', 'ALDÉHYDES', 'NÉROLI'],
    construction:
      "Dominés par les notes de tête, les parfums frais nécessitent des fixateurs modernes pour prolonger leur sensation d'énergie et de clarté tout au long de la journée.",
    imageUrl:
      'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'vert',
    name: 'Vert',
    subtitle: 'La Sève Végétale',
    description:
      "L'odeur de l'herbe coupée, des feuilles froissées, de la sève printanière. Une fraîcheur mordante, fusante et audacieuse qui tranche avec les compositions classiques.",
    creationsCount: 5,
    accords: ['GALBANUM', 'FEUILLE DE VIOLETTE', 'MENTHE', 'PETITGRAIN', 'LENTISQUE'],
    construction:
      "Très incisives en tête, les notes vertes apportent du montant et de la nervosité aux compositions florales ou boisées, créant un effet 'nature' saisissant.",
    imageUrl:
      'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&q=80&w=600',
  },
  {
    id: 'epice',
    name: 'Épicé',
    subtitle: 'La Chaleur Incandescente',
    description:
      'Piquantes, chaudes ou froides, les épices réveillent un parfum. Elles apportent du relief, de la vibration et un mystère incandescent aux compositions.',
    creationsCount: 9,
    accords: ['POIVRE NOIR', 'CANNELLE', 'CARDAMOME', 'SAFRAN', 'CLOU DE GIROFLE'],
    construction:
      'Les épices chaudes (cannelle, girofle) enflamment les orientaux, tandis que les épices froides (cardamome, baies roses) font vibrer les notes de tête boisées ou fraîches.',
    imageUrl:
      'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&q=80&w=600',
  },
];

export function OlfactoryFamilies() {
  const [activeFamilyId, setActiveFamilyId] = useState(FAMILIES[0]!.id);

  const activeFamily = FAMILIES.find((f) => f.id === activeFamilyId) ?? FAMILIES[0]!;

  return (
    <section className="bg-brand-ivory py-24 md:py-32 relative overflow-hidden border-t border-b border-brand-gold/10">
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-gold mb-4 block">
            Explorer par
          </span>
          <h2 className="font-serif text-4xl md:text-5xl text-brand-ink">Familles Olfactives</h2>
        </div>

        {/* Grid of Families (No Scroll) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 pt-4">
          {FAMILIES.map((family) => (
            <button
              key={family.id}
              onClick={() => setActiveFamilyId(family.id)}
              className={cn(
                'relative rounded-t-3xl rounded-b-xl overflow-hidden transition-all duration-500 ease-out group text-left border aspect-[3/4] w-full',
                activeFamilyId === family.id
                  ? 'border-brand-gold shadow-2xl shadow-brand-gold/10 scale-105 ring-4 ring-brand-ivory z-10'
                  : 'border-brand-gold/10 opacity-70 hover:opacity-100 hover:scale-[1.02] hover:border-brand-gold/30',
              )}
            >
              <img
                src={family.imageUrl}
                alt={family.name}
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-ink/90 via-brand-ink/30 to-transparent"></div>
              <div className="absolute bottom-6 left-0 right-0 text-center">
                <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] text-brand-ivory group-hover:text-brand-gold transition-colors">
                  {family.name}
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Detail View */}
        <div className="mt-12 md:mt-20 max-w-4xl mx-auto bg-white p-8 md:p-16 rounded-[2.5rem] md:rounded-[3rem] shadow-xl shadow-brand-ink/5 border border-brand-gold/5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFamily.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <div className="text-center mb-10">
                <h3 className="font-serif text-4xl md:text-6xl text-brand-ink mb-4">
                  {activeFamily.name}
                </h3>
                <p className="font-serif text-lg md:text-xl text-brand-gold italic">
                  {activeFamily.subtitle}
                </p>
              </div>

              <div className="w-16 h-px bg-brand-gold/20 mx-auto mb-12"></div>

              <div className="max-w-2xl mx-auto text-center">
                <p className="text-brand-ink/70 leading-relaxed mb-10 text-sm md:text-base">
                  {activeFamily.description}
                </p>

                <div className="mb-10">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/40 mb-4">
                    Accords Caractéristiques
                  </p>
                  <div className="flex flex-wrap justify-center gap-2">
                    {activeFamily.accords.map((accord) => (
                      <span
                        key={accord}
                        className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/70 bg-brand-ivory border border-brand-ink/10 px-4 py-2 rounded-full"
                      >
                        {accord}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-8 border-t border-brand-gold/10">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-ink/40 mb-4">
                    Construction Olfactive
                  </p>
                  <p className="text-brand-ink/60 leading-relaxed text-sm md:text-base italic">
                    "{activeFamily.construction}"
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
