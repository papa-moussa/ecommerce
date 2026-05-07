import { serverApi } from '@/lib/api';

import { EditorialTeaser } from './_components/home/editorial-teaser';
import { FeaturedSelection } from './_components/home/featured-selection';
import { HeroSection } from './_components/home/hero-section';
import { QuizTeaser } from './_components/home/quiz-teaser';
import { TrustBadges } from './_components/home/trust-badges';

export default async function HomePage(): Promise<JSX.Element> {
  const featured = await serverApi.products.featured().catch(() => []);

  return (
    <div className="flex flex-col min-h-screen">
      <HeroSection />
      <QuizTeaser />
      <FeaturedSelection products={featured} />
      <EditorialTeaser />
      <TrustBadges />
    </div>
  );
}
