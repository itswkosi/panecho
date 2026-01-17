'use client';

import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonLoaderProps {
  count?: number;
  height?: string;
  width?: string;
  className?: string;
  isLoading: boolean;
  children: React.ReactNode;
  ariaLabel?: string;
}

/**
 * Accessible Skeleton Loader Component
 * Shows skeleton UI while data is loading
 * Provides aria-busy to screen readers
 */
export function SkeletonLoader({
  count = 1,
  height = 'h-12',
  width = 'w-full',
  className = '',
  isLoading,
  children,
  ariaLabel = 'Loading',
}: SkeletonLoaderProps) {
  if (!isLoading) {
    return children;
  }

  return (
    <div
      className={`space-y-3 ${className}`}
      role="status"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={`${width} ${height}`} />
      ))}
    </div>
  );
}

/**
 * Skeleton for table rows
 */
export function SkeletonTableRow({ columns = 4 }: { columns?: number }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton className="w-full h-8" />
        </td>
      ))}
    </tr>
  );
}
