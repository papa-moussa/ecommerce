import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

const PRICE = (cents: number) => `${(cents / 100).toFixed(2)} €`;

const FAMILY_LABELS: Record<string, string> = {
  HESPERIDE: 'Hespéridé',
  FLORAL: 'Floral',
  BOISE: 'Boisé',
  ORIENTAL: 'Oriental',
  AMBRE: 'Ambré',
  FOUGERE: 'Fougère',
  CHYPRE: 'Chypré',
  CUIR: 'Cuir',
};

const OCCASION_LABELS: Record<string, string> = {
  DAILY: 'Quotidien',
  EVENING: 'Soirée',
  SPECIAL: 'Occasion spéciale',
  SPORT: 'Sport',
  OFFICE: 'Bureau',
};

const GENDER_LABELS: Record<string, string> = {
  HOMME: 'Homme',
  FEMME: 'Femme',
  UNISEXE: 'Mixte',
};

@Injectable()
export class ChatbaseService {
  constructor(private prisma: PrismaService) {}

  /**
   * Génère un texte structuré lisible par Chatbase pour alimenter
   * la knowledge base du chatbot (un bloc par produit).
   */
  async exportKnowledgeBase(): Promise<string> {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      include: {
        category: { select: { name: true } },
        variants: { orderBy: { priceCents: 'asc' } },
      },
      orderBy: { brand: 'asc' },
    });

    const faq = this.buildFaq();
    const catalog = products.map((p) => this.formatProduct(p)).join('\n\n---\n\n');

    return `# Catalogue Maison Parfum\n\n${catalog}\n\n---\n\n# FAQ\n\n${faq}`;
  }

  private formatProduct(p: {
    name: string;
    brand: string;
    description: string;
    storyTelling: string | null;
    topNotes: string[];
    heartNotes: string[];
    baseNotes: string[];
    gender: string;
    priceCents: number;
    family: string | null;
    occasions: string[];
    concentration: string | null;
    sizeMl: number | null;
    stockStatus: string;
    slug: string;
    category: { name: string };
    variants: { sizeMl: number; priceCents: number | null }[];
  }): string {
    const lines: string[] = [
      `## ${p.brand} — ${p.name}`,
      `Catégorie : ${p.category.name}`,
      `Genre : ${GENDER_LABELS[p.gender] ?? p.gender}`,
      `Prix : ${PRICE(p.priceCents)}`,
    ];

    if (p.family) lines.push(`Famille olfactive : ${FAMILY_LABELS[p.family] ?? p.family}`);
    if (p.concentration) lines.push(`Concentration : ${p.concentration.replace(/_/g, ' ')}`);
    if (p.occasions.length) {
      lines.push(`Occasions : ${p.occasions.map((o) => OCCASION_LABELS[o] ?? o).join(', ')}`);
    }
    if (p.topNotes.length) lines.push(`Notes de tête : ${p.topNotes.join(', ')}`);
    if (p.heartNotes.length) lines.push(`Notes de cœur : ${p.heartNotes.join(', ')}`);
    if (p.baseNotes.length) lines.push(`Notes de fond : ${p.baseNotes.join(', ')}`);
    if (p.variants.length > 1) {
      const sizes = p.variants
        .map((v) => `${v.sizeMl} ml — ${PRICE(v.priceCents ?? p.priceCents)}`)
        .join(' | ');
      lines.push(`Formats disponibles : ${sizes}`);
    }
    lines.push(
      `Disponibilité : ${p.stockStatus === 'OUT_OF_STOCK' ? 'Rupture de stock' : 'En stock'}`,
    );
    lines.push(`Description : ${p.description}`);
    if (p.storyTelling) lines.push(`Histoire : ${p.storyTelling}`);
    lines.push(`Lien produit : /produits/${p.slug}`);

    return lines.join('\n');
  }

  private buildFaq(): string {
    const items = [
      [
        'Délais de livraison',
        'Livraison standard 3-5 jours ouvrés, express 24h disponible en France métropolitaine.',
      ],
      [
        'Retours',
        'Retour accepté sous 14 jours si le flacon est non ouvert. Remboursement sous 5-7 jours ouvrés.',
      ],
      [
        'Échantillons',
        '3 échantillons offerts avec chaque commande. Vous pouvez les choisir lors du récapitulatif.',
      ],
      [
        'Authenticité',
        'Tous nos parfums sont 100 % authentiques, sourcés directement auprès des marques ou distributeurs agréés.',
      ],
      [
        'Paiement',
        'Nous acceptons CB, Visa, Mastercard, American Express et Apple Pay via Stripe.',
      ],
      [
        'Livraison internationale',
        "Nous livrons dans toute l'Europe. Les frais et délais varient selon le pays de destination.",
      ],
      [
        'Code promo',
        "Entrez votre code promo à l'étape récapitulatif du panier avant de valider votre commande.",
      ],
      [
        'Suivi de commande',
        "Un email avec le numéro de suivi vous est envoyé dès l'expédition de votre colis.",
      ],
    ];
    return items.map(([q, a]) => `**Q : ${q}**\nR : ${a}`).join('\n\n');
  }
}
