import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import styles from "./ProductImageGallery.module.css";

interface ProductImageGalleryProps {
  images: string[];
  alt?: string;
}

export function ProductImageGallery({ images, alt = "" }: ProductImageGalleryProps) {
  const [index, setIndex] = useState(0);
  const total = images.length;
  const hasMultiple = total > 1;

  useEffect(() => {
    setIndex(0);
  }, [images]);

  if (total === 0) return null;

  const safeIndex = Math.min(index, total - 1);
  const src = images[safeIndex];

  const goPrev = () => setIndex((i) => (i <= 0 ? total - 1 : i - 1));
  const goNext = () => setIndex((i) => (i >= total - 1 ? 0 : i + 1));

  return (
    <div className={styles.wrap}>
      <div className={styles.frame}>
        <img src={src} alt={alt} className={styles.image} />

        {hasMultiple && (
          <>
            <button
              type="button"
              className={`${styles.navBtn} ${styles.navPrev}`}
              onClick={goPrev}
              aria-label="Previous photo"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              className={`${styles.navBtn} ${styles.navNext}`}
              onClick={goNext}
              aria-label="Next photo"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {hasMultiple && (
        <div className={styles.footer}>
          <span className={styles.counter}>
            {safeIndex + 1} / {total}
          </span>
          <div className={styles.dots} aria-hidden>
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                className={i === safeIndex ? styles.dotActive : styles.dot}
                onClick={() => setIndex(i)}
                aria-label={`Photo ${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
