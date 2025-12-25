/**
 * EmptyState - Reusable empty state component for views
 * Shows helpful message and optional action when data is empty
 */
import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    children?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action, children }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center text-center py-12 px-6">
            <div className="bg-slate-800/50 p-4 rounded-full mb-4">
                <Icon size={40} className="text-slate-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-300 mb-2">{title}</h3>
            <p className="text-slate-500 max-w-md mb-6">{description}</p>
            {action && (
                <button
                    onClick={action.onClick}
                    className="px-6 py-2.5 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition-colors font-medium"
                >
                    {action.label}
                </button>
            )}
            {children}
        </div>
    );
}
