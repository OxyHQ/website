import type { ReactNode } from 'react';

interface ProductCardProps {
  children: ReactNode;
  className?: string;
  animated?: boolean;
}

export default function ProductCard({
  children,
  className = '',
  animated = false,
}: ProductCardProps) {
  return (
    <div
      className={`rounded-xl bg-primary-background shadow-attio-product-e1 ${className}`}
      style={
        animated
          ? {
              filter: 'blur(1px)',
              opacity: 0,
              transform: 'translateY(10px)',
              transition:
                'filter 0.6s ease-out, opacity 0.6s ease-out, transform 0.6s ease-out',
            }
          : undefined
      }
    >
      {children}
    </div>
  );
}
