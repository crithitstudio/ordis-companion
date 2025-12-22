import type { LucideIcon } from 'lucide-react';

interface CycleCardProps {
    title: string;
    state: string;
    subState?: string;
    timeLeft: string;
    icon: LucideIcon;
    colorClass: string;
}

export function CycleCard({
    title,
    state,
    subState,
    timeLeft,
    icon: Icon,
    colorClass
}: CycleCardProps) {
    // Derive text color from the colorClass for consistent theming
    const getTextColorClass = (color: string) => {
        if (color.includes('yellow')) return 'text-yellow-500';
        if (color.includes('indigo')) return 'text-indigo-400';
        if (color.includes('orange')) return 'text-orange-500';
        if (color.includes('blue')) return 'text-blue-400';
        if (color.includes('cyan')) return 'text-cyan-600';
        if (color.includes('green')) return 'text-green-500';
        if (color.includes('emerald')) return 'text-emerald-800';
        return 'text-slate-400';
    };

    const textColor = getTextColorClass(colorClass);

    return (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 flex items-center justify-between shadow-lg backdrop-blur-sm relative overflow-hidden group">
            <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500 bg-gradient-to-r from-transparent to-current" />
            <div>
                <h3 className="text-slate-400 text-xs uppercase tracking-wider font-bold mb-1">{title}</h3>
                <div className="flex items-center space-x-2">
                    <span className={`text-lg font-bold ${textColor}`}>{state}</span>
                    {subState && <span className="text-slate-500 text-sm">({subState})</span>}
                </div>
                <p className="text-slate-300 text-sm mt-1 font-mono">{timeLeft}</p>
            </div>
            <div className={`p-3 rounded-full bg-slate-900/50 ${textColor}`}>
                {Icon && <Icon size={24} />}
            </div>
        </div>
    );
}
