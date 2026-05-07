import { Mail, Phone, MapPin } from 'lucide-react';

export default function ContactPage() {
  return (
    <div className="bg-brand-ivory min-h-screen text-brand-ink relative overflow-hidden">
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-24 md:py-32">
        {/* Header */}
        <div className="text-center mb-24">
          <div className="flex items-center justify-center gap-6 mb-8">
            <div className="w-12 h-px bg-brand-gold/40"></div>
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-gold">
              Maison Parfum
            </span>
            <div className="w-12 h-px bg-brand-gold/40"></div>
          </div>
          <h1 className="font-serif text-5xl md:text-7xl mb-6 text-brand-ink">Contactez-nous</h1>
          <p className="text-brand-ink/60 max-w-lg mx-auto text-sm md:text-base leading-relaxed">
            Notre équipe d'experts est à votre écoute pour vous conseiller dans votre choix olfactif
            ou pour toute question sur votre commande.
          </p>
        </div>

        {/* Contact Info Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 border-y border-brand-gold/20 py-16 mb-24 relative">
          <div className="flex flex-col items-center text-center px-4 border-b md:border-b-0 md:border-r border-brand-gold/20 pb-12 md:pb-0 mb-12 md:mb-0">
            <Mail className="w-5 h-5 text-brand-gold mb-6" strokeWidth={1.5} />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-ink/40 mb-3">
              Email
            </span>
            <a
              href="mailto:contact@maisonparfum.com"
              className="text-brand-ink/80 font-medium text-sm hover:text-brand-gold transition-colors"
            >
              contact@maisonparfum.com
            </a>
          </div>
          <div className="flex flex-col items-center text-center px-4 border-b md:border-b-0 md:border-r border-brand-gold/20 pb-12 md:pb-0 mb-12 md:mb-0">
            <Phone className="w-5 h-5 text-brand-gold mb-6" strokeWidth={1.5} />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-ink/40 mb-3">
              Téléphone
            </span>
            <a
              href="tel:+33123456789"
              className="text-brand-ink/80 font-medium text-sm hover:text-brand-gold transition-colors"
            >
              +221 33 968 00 00
            </a>
          </div>
          <div className="flex flex-col items-center text-center px-4">
            <MapPin className="w-5 h-5 text-brand-gold mb-6" strokeWidth={1.5} />
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-ink/40 mb-3">
              Localisation
            </span>
            <span className="text-brand-ink/80 font-medium text-sm">Dakar, Sénégal</span>
          </div>
        </div>

        {/* Form Section */}
        <div className="max-w-2xl mx-auto">
          <div className="mb-12 text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-brand-gold mb-4 block">
              Clients & Commandes
            </span>
            <h2 className="font-serif text-3xl md:text-4xl mb-4 text-brand-ink">
              Une question sur votre commande ?
            </h2>
            <p className="text-brand-ink/60 text-sm leading-relaxed max-w-xl mx-auto">
              Pour toute demande concernant nos parfums, vos commandes ou nos services, veuillez
              utiliser ce formulaire. Nous vous répondrons dans les plus brefs délais.
            </p>
          </div>

          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <input
                type="text"
                placeholder="Nom"
                className="bg-white/50 border border-brand-ink/10 rounded-lg px-5 py-4 text-brand-ink placeholder:text-brand-ink/30 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold focus:outline-none transition-all text-sm w-full shadow-sm"
              />
              <input
                type="email"
                placeholder="E-mail"
                className="bg-white/50 border border-brand-ink/10 rounded-lg px-5 py-4 text-brand-ink placeholder:text-brand-ink/30 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold focus:outline-none transition-all text-sm w-full shadow-sm"
              />
            </div>
            <input
              type="text"
              placeholder="Sujet de votre demande"
              className="bg-white/50 border border-brand-ink/10 rounded-lg px-5 py-4 text-brand-ink placeholder:text-brand-ink/30 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold focus:outline-none transition-all text-sm w-full shadow-sm"
            />
            <textarea
              placeholder="Votre message"
              rows={6}
              className="bg-white/50 border border-brand-ink/10 rounded-lg px-5 py-4 text-brand-ink placeholder:text-brand-ink/30 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold focus:outline-none transition-all text-sm w-full resize-none shadow-sm"
            ></textarea>
            <button
              type="button"
              className="w-full bg-brand-ink text-brand-ivory hover:bg-brand-gold hover:text-brand-ink transition-all duration-300 px-6 py-4 rounded-lg text-xs font-bold uppercase tracking-[0.2em] mt-4 shadow-xl shadow-brand-ink/10"
            >
              Envoyer le message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
