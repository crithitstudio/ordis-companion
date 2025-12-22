interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({
  message = "Loading...",
  size = "md",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-8 h-8 border-2",
    md: "w-12 h-12 border-4",
    lg: "w-16 h-16 border-4",
  };

  return (
    <div className="p-12 flex flex-col items-center justify-center space-y-4">
      <div
        className={`${sizeClasses[size]} border-slate-700 border-t-cyan-500 rounded-full animate-spin`}
        role="status"
        aria-label="Loading"
      />
      {message && (
        <div className="text-slate-400 animate-pulse font-mono tracking-wider">
          {message}
        </div>
      )}
    </div>
  );
}

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorDisplay({
  title = "Error",
  message,
  onRetry,
  retryLabel = "Retry",
}: ErrorDisplayProps) {
  return (
    <div className="p-12 flex flex-col items-center justify-center text-center space-y-6 bg-slate-900/50 rounded-xl border border-red-900/30">
      <div className="p-4 bg-red-900/20 rounded-full text-red-400">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
        </svg>
      </div>
      <div>
        <h2 className="text-xl font-bold text-slate-200">{title}</h2>
        <p className="text-slate-400 mt-2 max-w-sm mx-auto">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 bg-red-800/80 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
            <path d="M21 3v5h-5" />
          </svg>
          {retryLabel}
        </button>
      )}
    </div>
  );
}
