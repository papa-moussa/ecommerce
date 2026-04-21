'use client';

import { cn } from '@ecommerce/ui';
import useEmblaCarousel from 'embla-carousel-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';
import InnerImageZoom from 'react-inner-image-zoom';

import 'react-inner-image-zoom/lib/styles.min.css';

export interface GalleryImage {
  id: string;
  url: string;
  alt: string | null;
  isMain: boolean;
}

interface ProductGalleryProps {
  images: GalleryImage[];
  productName: string;
}

export function ProductGallery({ images, productName }: ProductGalleryProps): JSX.Element {
  const [selected, setSelected] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, skipSnaps: false });

  const onThumbClick = useCallback(
    (index: number) => {
      if (!emblaApi) return;
      emblaApi.scrollTo(index);
      setSelected(index);
    },
    [emblaApi],
  );

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
    };
  }, [emblaApi]);

  if (images.length === 0) {
    return (
      <div className="flex aspect-square items-center justify-center rounded-xl bg-brand-ivory text-brand-ink/20">
        —
      </div>
    );
  }

  const currentImage = images[selected] ?? images[0] ?? { alt: productName };

  return (
    <div className="space-y-3">
      {/* Main carousel */}
      <div className="overflow-hidden rounded-xl" ref={emblaRef}>
        <div className="flex">
          {images.map((img, i) => (
            <div
              key={img.id}
              className="relative min-w-0 flex-[0_0_100%]"
              aria-hidden={i !== selected}
            >
              {/* Desktop: zoom on hover; mobile: plain Image */}
              <div className="hidden md:block">
                <InnerImageZoom
                  src={img.url}
                  zoomSrc={img.url}
                  zoomType="hover"
                  zoomScale={1.8}
                  imgAttributes={{
                    alt: img.alt ?? `${productName} — vue ${i + 1}`,
                    className: 'aspect-square w-full object-cover',
                  }}
                />
              </div>
              <div className="relative aspect-square md:hidden">
                <Image
                  src={img.url}
                  alt={img.alt ?? `${productName} — vue ${i + 1}`}
                  fill
                  priority={i === 0}
                  sizes="100vw"
                  className="object-cover"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2" role="tablist" aria-label="Vues du produit">
          {images.map((img, i) => (
            <button
              key={img.id}
              role="tab"
              aria-selected={i === selected}
              aria-label={img.alt ?? `Vue ${i + 1}`}
              onClick={() => onThumbClick(i)}
              className={cn(
                'relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-all',
                i === selected
                  ? 'border-brand-gold opacity-100'
                  : 'border-transparent opacity-60 hover:opacity-100',
              )}
            >
              <Image
                src={img.url}
                alt={img.alt ?? `Vue ${i + 1}`}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Accessible label for screen readers */}
      <p className="sr-only">
        Image {selected + 1} sur {images.length} : {currentImage.alt ?? productName}
      </p>
    </div>
  );
}
