import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useMediaQuery } from '../../hooks/useMediaQuery';

interface ManifestoSectionProps {
  imagePaths?: string[];
}

interface ImageItem {
  id: string;
  imageIndex: number;
  cellIndex: number;
  x: number;
  y: number;
  width: number;
  expiresAt: number;
}

export const ManifestoSection: React.FC<ManifestoSectionProps> = ({ imagePaths = [] }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [images, setImages] = useState<ImageItem[]>([]);
  const isInView = useInView(containerRef, { amount: 0.3 });
  const [isActive, setIsActive] = useState(false);
  const usedCells = useRef<Set<number>>(new Set());
  const imageCounter = useRef(0);

  // Match original: Desktop {min: 40, max: 70}, Mobile {min: 20, max: 40}
  const isMobile = useMediaQuery('(max-width: 767px)');
  const widthRange = React.useMemo(
    () => (isMobile ? { min: 20, max: 40 } : { min: 40, max: 70 }),
    [isMobile]
  );

  const getRandomPosition = useCallback((): { cellIndex: number; x: number; y: number } | null => {
    const availableCells = Array.from({ length: 80 }, (_, i) => i).filter((i) => {
      const col = i % 10;
      const row = Math.floor(i / 10);
      return !usedCells.current.has(i) && (col < 3 || col > 6 || row < 3 || row > 4);
    });

    if (!availableCells.length) return null;

    const cellIndex = availableCells[Math.floor(Math.random() * availableCells.length)];
    usedCells.current.add(cellIndex);

    const col = cellIndex % 10;
    const row = Math.floor(cellIndex / 10);

    return {
      cellIndex,
      x: 5 + 9 * col + 4.5 + (Math.random() - 0.5) * 7.2,
      y: 5 + 11.25 * row + 5.625 + (Math.random() - 0.5) * 9,
    };
  }, []);

  const addImage = useCallback(() => {
    const position = getRandomPosition();
    if (!position) return;

    const newImage: ImageItem = {
      id: `img-${imageCounter.current++}`,
      imageIndex: imageCounter.current % imagePaths.length,
      cellIndex: position.cellIndex,
      x: position.x,
      y: position.y,
      width: widthRange.min + Math.random() * (widthRange.max - widthRange.min),
      expiresAt: Date.now() + 2500 + 1500 * Math.random(),
    };

    setImages((prev) => [...prev, newImage]);
  }, [getRandomPosition, imagePaths.length, widthRange]);

  const clearImages = useCallback(() => {
    usedCells.current.clear();
    imageCounter.current = 0;
    setImages([]);
  }, []);

  // Add images periodically when active
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(addImage, 150);
    return () => clearInterval(interval);
  }, [isActive, addImage]);

  // Remove expired images
  useEffect(() => {
    if (!isActive) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setImages((prev) => {
        const expired = prev.filter((img) => img.expiresAt <= now);
        expired.forEach((img) => {
          usedCells.current.delete(img.cellIndex);
        });
        return prev.filter((img) => img.expiresAt > now);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isActive]);

  // Handle in-view state
  useEffect(() => {
    if (isInView && !isActive) {
      setIsActive(true);
      // Initial burst of 12 images with 80ms intervals (matching original)
      const timeout = setTimeout(() => {
        for (let i = 0; i < 12; i++) {
          setTimeout(() => addImage(), 80 * i);
        }
      }, 800); // Match original 800ms initial delay
      return () => clearTimeout(timeout);
    } else if (!isInView && isActive) {
      clearImages();
      setIsActive(false);
    }
  }, [isInView, isActive, addImage, clearImages]);

  return (
    <div data-section="image-by-image" className="h-dvh bg-white dark:bg-black">
      <div className="relative h-full w-full" ref={containerRef}>
        <div className="pointer-events-none invisible absolute h-0 w-0 overflow-hidden" aria-hidden="true">
          {imagePaths.map((src, idx) => (
            <img key={idx} src={src || "/placeholder.svg"} alt="" />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <AnimatePresence>
            {images.map((img) => (
              <motion.img
                key={img.id}
                src={imagePaths[img.imageIndex]}
                alt=""
                className="absolute rounded-xl object-cover"
                style={{
                  left: `${img.x}%`,
                  top: `${img.y}%`,
                  width: img.width,
                  height: img.width * 1.2,
                  transform: 'translate(-50%, -50%)',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: 'easeInOut' }}
              />
            ))}
          </AnimatePresence>
        </div>
        <div className="pointer-events-none absolute inset-0 mx-auto flex h-screen w-full flex-col items-center justify-center">
          <h2 className="text-heading-xlarge font-regular text-center text-white mix-blend-difference">
            Image by image.
          </h2>
          <h2 className="text-heading-xlarge font-regular text-center text-white mix-blend-difference">
            Day by day.
          </h2>
        </div>
      </div>
    </div>
  );
};
