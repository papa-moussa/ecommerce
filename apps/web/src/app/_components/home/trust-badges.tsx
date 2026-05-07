import { Package, Gift, Droplet, RefreshCcw } from 'lucide-react';

export function TrustBadges() {
  const badges = [
    {
      icon: <Package className="w-6 h-6 mb-4" strokeWidth={1} />,
      title: 'Livraison Offerte',
      description: 'Pour toute commande supérieure à 150€',
    },
    {
      icon: <Droplet className="w-6 h-6 mb-4" strokeWidth={1} />,
      title: '2 Échantillons Inclus',
      description: 'Pour découvrir de nouvelles signatures',
    },
    {
      icon: <Gift className="w-6 h-6 mb-4" strokeWidth={1} />,
      title: 'Écrin Signature',
      description: 'Un emballage luxueux pour chaque flacon',
    },
    {
      icon: <RefreshCcw className="w-6 h-6 mb-4" strokeWidth={1} />,
      title: 'Retours Facilités',
      description: 'Retours offerts sous 30 jours',
    },
  ];

  return (
    <section className="bg-brand-ink text-brand-ivory py-16 border-t border-brand-gold/10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {badges.map((badge, idx) => (
            <div key={idx} className="flex flex-col items-center text-center">
              <div className="text-brand-gold opacity-80">{badge.icon}</div>
              <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] mb-2 text-white/90">
                {badge.title}
              </h4>
              <p className="text-white/40 text-xs">{badge.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
