// Skeleton loading components

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circle" | "rectangle";
  count?: number;
}

/**
 * Skeleton loading component for better UX during async operations
 */
export function Skeleton({
  className = "",
  variant = "rectangle",
  count = 1,
}: SkeletonProps) {
  const baseClass = "skeleton";

  const variantClasses = {
    text: "h-4 rounded",
    circle: "rounded-full aspect-square",
    rectangle: "h-12 rounded-lg",
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${baseClass} ${variantClasses[variant]} ${className}`}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

interface LoadingCardProps {
  count?: number;
}

/**
 * Loading placeholder for card-style content
 */
export function LoadingCard({ count = 3 }: LoadingCardProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-slate-800/30 rounded-lg p-4 border border-slate-700/50"
        >
          <Skeleton className="h-6 w-3/4 mb-3" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ))}
    </div>
  );
}

/**
 * Loading placeholder for list-style content
 */
export function LoadingList({ count = 5 }: LoadingCardProps) {
  return (
    <div className="space-y-2">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg"
        >
          <Skeleton variant="circle" className="w-10 h-10" />
          <div className="flex-1">
            <Skeleton className="h-4 w-1/2 mb-2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
}
