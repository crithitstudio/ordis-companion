import { useState, useMemo } from 'react';
import { Book, Search, X, ExternalLink, ChevronDown, ChevronUp, Info, Plus, Check } from 'lucide-react';
import { itemNames, itemsData, getItemImageUrl, getItemCategory } from '../../utils/translations';
import { ItemDetailModal } from './ItemDetailModal';
import type { SavedItem } from '../../types';

const CATEGORIES = ['all', 'Warframe', 'Primary', 'Secondary', 'Melee', 'Mod', 'Resource', 'Other'];

export function CodexView() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [expandedItem, setExpandedItem] = useState<string | null>(null);
    const [selectedItemPath, setSelectedItemPath] = useState<string | null>(null);

    // Get all items for search
    const allItems = useMemo(() => {
        return Object.entries(itemNames).map(([path, name]) => ({
            path,
            name,
            category: getItemCategory(path)
        }));
    }, []);

    // Filter items based on search and category
    const filteredItems = useMemo(() => {
        let items = allItems;

        if (selectedCategory !== 'all') {
            items = items.filter(item => item.category === selectedCategory);
        }

        if (searchQuery.length >= 2) {
            const query = searchQuery.toLowerCase();
            items = items.filter(item =>
                item.name.toLowerCase().includes(query)
            );
        }

        return items.slice(0, 100); // Limit for performance
    }, [allItems, searchQuery, selectedCategory]);

    return (
        <div className="space-y-6">
            <div className="bg-slate-900/50 rounded-xl border border-cyan-900/30 p-6">
                <h2 className="text-2xl font-bold text-cyan-400 mb-4 flex items-center gap-3">
                    <Book size={28} /> Item Codex
                </h2>

                {/* Search Bar */}
                <div className="relative mb-4">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <input
                        type="text"
                        placeholder="Search items... (min 2 characters)"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none transition-colors"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                            aria-label="Clear search"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>

                {/* Category Filter */}
                <div className="flex flex-wrap gap-2 mb-6">
                    {CATEGORIES.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${selectedCategory === cat
                                ? 'bg-cyan-600 text-white'
                                : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
                                }`}
                        >
                            {cat === 'all' ? 'All Items' : cat}
                        </button>
                    ))}
                </div>

                {/* Results */}
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {searchQuery.length < 2 && selectedCategory === 'all' ? (
                        <div className="text-center text-slate-500 py-8">
                            <Search size={48} className="mx-auto mb-4 opacity-50" />
                            <p>Type at least 2 characters to search, or select a category</p>
                        </div>
                    ) : filteredItems.length === 0 ? (
                        <div className="text-center text-slate-500 py-8">
                            <p>No items found matching your search</p>
                        </div>
                    ) : (
                        filteredItems.map(item => {
                            const itemInfo = itemsData[item.path];
                            const imageUrl = itemInfo ? getItemImageUrl(itemInfo) : null;
                            return (
                                <div
                                    key={item.path}
                                    className="bg-slate-800/30 rounded-lg border border-slate-700/50 hover:border-cyan-700/50 transition-colors"
                                >
                                    <button
                                        onClick={() => setExpandedItem(expandedItem === item.path ? null : item.path)}
                                        className="w-full p-4 flex items-center justify-between text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            {imageUrl && (
                                                <img
                                                    src={imageUrl}
                                                    alt={item.name}
                                                    className="w-10 h-10 object-contain rounded bg-slate-900"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                                />
                                            )}
                                            <div>
                                                <h3 className="text-slate-200 font-medium">{item.name}</h3>
                                                <p className="text-xs text-slate-500">{item.category}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <a
                                                href={`https://wiki.warframe.com/${encodeURIComponent(item.name.replace(/ /g, '_'))}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="p-2 text-slate-400 hover:text-cyan-400 transition-colors"
                                                title="View on Wiki"
                                            >
                                                <ExternalLink size={16} />
                                            </a>
                                            {expandedItem === item.path ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                    </button>
                                    {expandedItem === item.path && (
                                        <div className="px-4 pb-4 border-t border-slate-700/50 pt-3">
                                            <p className="text-xs text-slate-500 font-mono break-all mb-3">{item.path}</p>
                                            <div className="flex flex-wrap gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setSelectedItemPath(item.path); }}
                                                    className="flex items-center gap-2 px-3 py-2 bg-cyan-600/20 text-cyan-400 rounded-lg text-sm hover:bg-cyan-600/30 transition-colors"
                                                >
                                                    <Info size={14} /> View Details
                                                </button>
                                                <a
                                                    href={`https://wiki.warframe.com/${encodeURIComponent(item.name.replace(/ /g, '_'))}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-center gap-2 px-3 py-2 bg-orange-600/20 text-orange-400 rounded-lg text-sm hover:bg-orange-600/30 transition-colors"
                                                >
                                                    <ExternalLink size={14} /> Wiki
                                                </a>
                                                <AddToTrackerButton itemName={item.name} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                    {filteredItems.length === 100 && (
                        <p className="text-center text-slate-500 text-sm py-2">Showing first 100 results. Refine your search for more specific results.</p>
                    )}
                </div>
            </div>

            {/* Item Detail Modal */}
            <ItemDetailModal itemKey={selectedItemPath} onClose={() => setSelectedItemPath(null)} />
        </div>
    );
}

// Add to tracker button component
function AddToTrackerButton({ itemName }: { itemName: string }) {
    const [added, setAdded] = useState(false);

    const handleAdd = () => {
        const saved = JSON.parse(localStorage.getItem('ordis-tracker') || '[]') as SavedItem[];
        if (!saved.find(s => s.name === itemName)) {
            saved.push({
                id: Date.now().toString(),
                name: itemName,
                category: 'Item',
                notes: '',
                completed: false,
                addedAt: Date.now()
            });
            localStorage.setItem('ordis-tracker', JSON.stringify(saved));
            setAdded(true);
            setTimeout(() => setAdded(false), 2000);
        }
    };

    return (
        <button
            onClick={(e) => { e.stopPropagation(); handleAdd(); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${added
                ? 'bg-green-600/20 text-green-400'
                : 'bg-cyan-600/20 text-cyan-400 hover:bg-cyan-600/30'
                }`}
        >
            {added ? <Check size={14} /> : <Plus size={14} />}
            {added ? 'Added!' : 'Track'}
        </button>
    );
}
