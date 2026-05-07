/**
 * Custom Cloudinary loader for Next.js Image component.
 * It injects optimization parameters (f_auto, q_auto, w_auto) into the URL.
 */
export default function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}) {
  // 1. Cloudinary optimization
  if (src.includes('cloudinary.com')) {
    const params = [`w_${width}`, 'f_auto', 'q_auto' + (quality ? `:${quality}` : '')].join(',');

    if (src.includes('/upload/')) {
      return src.replace('/upload/', `/upload/${params}/`);
    }
  }

  // 2. Picsum photos (used in seeds/tests)
  if (src.includes('picsum.photos')) {
    // Replace trailing /width/height with /width/height based on requested width
    return src.replace(/\/\d+\/\d+$/, `/${width}/${Math.round(width * 0.75)}`);
  }

  // 3. Generic fallback to satisfy Next.js (it expects the URL to change with width)
  return `${src}${src.includes('?') ? '&' : '?'}w=${width}`;
}
