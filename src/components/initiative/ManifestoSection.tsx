import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [images, setImages] = useState<ImageItem[]>([]);
  const [isActive, setIsActive] = useState(false);
  const usedCells = useRef<Set<number>>(new Set());
  const imageCounter = useRef(0);

  // Match original: Desktop {min: 40, max: 70}, Mobile {min: 20, max: 40}
  const isMobile = useMediaQuery('(max-width: 767px)');
  const widthRange = React.useMemo(
    () => (isMobile ? { min: 20, max: 40 } : { min: 40, max: 70 }),
    [isMobile]
  );
  const widthRangeRef = useRef(widthRange);
  widthRangeRef.current = widthRange;
  const imagePathsLengthRef = useRef(imagePaths.length);
  imagePathsLengthRef.current = imagePaths.length;

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
      imageIndex: imageCounter.current % imagePathsLengthRef.current,
      cellIndex: position.cellIndex,
      x: position.x,
      y: position.y,
      width: widthRangeRef.current.min + Math.random() * (widthRangeRef.current.max - widthRangeRef.current.min),
      expiresAt: Date.now() + 2500 + 1500 * Math.random(),
    };

    setImages((prev) => [...prev, newImage]);
  }, [getRandomPosition]);

  const clearImages = useCallback(() => {
    usedCells.current.clear();
    imageCounter.current = 0;
    setImages([]);
  }, []);

  useEffect(() => {
    if (!isActive) return
    const spawn = setInterval(addImage, 150)
    const expire = setInterval(() => {
      const now = Date.now()
      setImages((prev) => {
        prev.forEach((img) => {
          if (img.expiresAt <= now) usedCells.current.delete(img.cellIndex)
        })
        return prev.filter((img) => img.expiresAt > now)
      })
    }, 100)
    const burstTimers: number[] = []
    const burstStart = window.setTimeout(() => {
      for (let i = 0; i < 12; i++) {
        burstTimers.push(window.setTimeout(() => addImage(), 80 * i))
      }
    }, 800)
    return () => {
      clearInterval(spawn)
      clearInterval(expire)
      clearTimeout(burstStart)
      burstTimers.forEach((id) => clearTimeout(id))
    }
  }, [isActive, addImage])

  return (
    <motion.div
      data-section="image-by-image"
      className="h-dvh bg-white dark:bg-black"
      onViewportEnter={() => setIsActive(true)}
      onViewportLeave={() => {
        setIsActive(false)
        clearImages()
      }}
      viewport={{ amount: 0.3 }}
    >
      <div className="relative h-full w-full">
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
            The Oxy Initiative.
          </h2>
          <h2 className="text-heading-xlarge font-regular text-center text-white mix-blend-difference">
            Building the future, together.
          </h2>
        </div>
      </div>
    </motion.div>
  );
};
