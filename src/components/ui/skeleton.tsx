import { cn } from '@/lib/utils';

/**
 * Skeleton Component
 * Used for loading states to prevent layout shift
 * Accessible with proper aria-busy attributes
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-slate-200 dark:bg-slate-700', className)}
      {...props}
    />
  );
}
