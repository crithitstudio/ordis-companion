import { useState, useCallback, type ReactNode } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface CollapsibleSectionProps {
  title: string;
  icon?: ReactNode;
  iconColorClass?: string;
  defaultOpen?: boolean;
  children: ReactNode;
  badge?: string | number;
  badgeColorClass?: string;
  storageKey?: string; // For persisting collapse state
}

export function CollapsibleSection({
  title,
  icon,
  iconColorClass = "text-cyan-400",
  defaultOpen = true,
  children,
  badge,
  badgeColorClass = "bg-slate-700 text-slate-300",
  storageKey,
}: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(() => {
    if (storageKey) {
      const saved = localStorage.getItem(`ordis-collapse-${storageKey}`);
      if (saved !== null) {
        return saved === "true";
      }
    }
    return defaultOpen;
  });

  const toggle = useCallback(() => {
    setIsOpen((prev) => {
      const newState = !prev;
      if (storageKey) {
        localStorage.setItem(`ordis-collapse-${storageKey}`, String(newState));
      }
      return newState;
    });
  }, [storageKey]);

  return (
    <section className="animate-in">
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between mb-4 group cursor-pointer focus-ring rounded-lg p-1 -m-1"
        aria-expanded={isOpen}
      >
        <h2 className="text-xl font-bold text-slate-200 flex items-center gap-2">
          {icon && <span className={iconColorClass}>{icon}</span>}
          {title}
          {badge !== undefined && (
            <span
              className={`text-xs px-2 py-0.5 rounded font-medium ${badgeColorClass}`}
            >
              {badge}
            </span>
          )}
        </h2>
        <span className="text-slate-500 group-hover:text-slate-300 transition-colors">
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </span>
      </button>
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {children}
      </div>
    </section>
  );
}
