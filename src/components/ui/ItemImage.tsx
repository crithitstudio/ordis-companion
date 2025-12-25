import { useState } from "react";
import {
    Crosshair,
    Swords,
    ShieldCheck,
    Zap,
    Target,
    Bot,
    Dog,
    Gem,
    Puzzle,
    Package,
    HelpCircle,
} from "lucide-react";
import { getItemImageUrl, itemsData } from "../../utils/translations";

interface ItemImageProps {
    /** Item uniqueName/path for lookup in itemsData */
    itemPath?: string | null;
    /** Direct item data with imageName */
    itemData?: { imageName?: string | null; uniqueName?: string } | null;
    /** Item name for alt text */
    name: string;
    /** Item category for fallback icon */
    category?: string;
    /** Image size in pixels */
    size?: number;
    /** Additional CSS classes */
    className?: string;
}

/** Category to icon mapping */
const CATEGORY_ICONS: Record<string, typeof Crosshair> = {
    Warframe: ShieldCheck,
    Primary: Crosshair,
    Secondary: Target,
    Melee: Swords,
    "Arch-Gun": Zap,
    "Arch-Melee": Swords,
    Archwing: Zap,
    Sentinel: Bot,
    "Sentinel Weapon": Crosshair,
    Pet: Dog,
    Companion: Dog,
    Robotic: Bot,
    Mod: Puzzle,
    Resource: Gem,
    Relic: Gem,
    Other: Package,
};

/**
 * A reusable image component for Warframe items with proper fallback handling.
 * Shows WFCD image if available, otherwise displays a category-specific icon.
 * Never leaves empty space.
 */
export function ItemImage({
    itemPath,
    itemData,
    name,
    category = "Other",
    size = 40,
    className = "",
}: ItemImageProps) {
    const [imageError, setImageError] = useState(false);

    // Resolve item data from path if not provided directly
    const resolvedItemData = itemData || (itemPath ? itemsData[itemPath] : null);
    const imageUrl = !imageError ? getItemImageUrl(resolvedItemData) : null;

    // Get fallback icon for category
    const FallbackIcon = CATEGORY_ICONS[category] || HelpCircle;

    const containerStyle = {
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
    };

    // If we have a valid image URL and no error, show the image
    if (imageUrl && !imageError) {
        return (
            <div
                className={`bg-slate-900 rounded flex items-center justify-center overflow-hidden ${className}`}
                style={containerStyle}
            >
                <img
                    src={imageUrl}
                    alt={name}
                    className="w-full h-full object-contain"
                    onError={() => setImageError(true)}
                    loading="lazy"
                />
            </div>
        );
    }

    // Fallback: show category icon
    return (
        <div
            className={`bg-slate-800/50 rounded flex items-center justify-center border border-slate-700/50 ${className}`}
            style={containerStyle}
            title={`${name} (${category})`}
        >
            <FallbackIcon
                size={Math.round(size * 0.5)}
                className="text-slate-500"
                aria-hidden="true"
            />
        </div>
    );
}
