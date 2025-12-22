import { useState, useMemo } from 'react';
import { Star, Search, Check } from 'lucide-react';
import { useLocalStorageSet } from '../../hooks/useLocalStorage';
import { itemsData, getItemImageUrl } from '../../utils/translations';

const CATEGORIES = ['all', 'Warframes', 'Primary', 'Secondary', 'Melee', 'Sentinel', 'Companions', 'Archwing'];

export function MasteryView() {
    const [masteredItems, updateMasteredItems] = useLocalStorageSet<string>('ordis-mastery');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    // Get all masterable items from itemsData
    const masterableItems = useMemo(() => {
        const items: { path: string; name: string; category: string; imageName?: string; uniqueName: string }[] = [];
        Object.entries(itemsData).forEach(([path, data]) => {
            const cat = data.category || data.type || '';
            if (['Warframes', 'Primary', 'Secondary', 'Melee', 'Sentinel', 'Companions',
                'Archwing', 'Arch-Gun', 'Arch-Melee', 'Amp', 'K-Drive', 'Necramech'].includes(cat)) {
                items.push({
                    path,
                    name: data.name,
                    category: cat,
                    imageName: data.imageName || undefined,
                    uniqueName: path
                });
            }
        });
        return items.sort((a, b) => a.name.localeCompare(b.name));
    }, []);

    const filteredItems = useMemo(() => {
        let items = masterableItems;
        if (selectedCategory !== 'all') {
            items = items.filter(i => i.category === selectedCategory);
        }
        if (searchQuery.length >= 2) {
            const q = searchQuery.toLowerCase();
            items = items.filter(i => i.name.toLowerCase().includes(q));
        }
        return items;
    }, [masterableItems, selectedCategory, searchQuery]);

    const toggleMastered = (path: string) => {
        updateMasteredItems((prev) => {
            const updated = new Set(prev);
            if (updated.has(path)) {
                updated.delete(path);
            } else {
                updated.add(path);
            }
            return updated;
        });
    };

    // Calculate progress
    const totalItems = masterableItems.length;
    const masteredCount = masterableItems.filter(i => masteredItems.has(i.path)).length;
    const progressPercent = totalItems > 0 ? Math.round((masteredCount / totalItems) * 100) : 0;

    // Category breakdown
    const categoryStats = useMemo(() => {
        const stats: Record<string, { total: number; mastered: number }> = {};
        masterableItems.forEach(item => {
            if (!stats[item.category]) stats[item.category] = { total: 0, mastered: 0 };
            stats[item.category].total++;
            if (masteredItems.has(item.path)) stats[item.category].mastered++;
        });
        return stats;
    }, [masterableItems, masteredItems]);

    return (
        <div className="space-y-6">
            {/* Progress Overview */}
            <section className="bg-gradient-to-r from-cyan-900/30 to-slate-900/50 rounded-xl border border-cyan-700/30 p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold text-cyan-400 flex items-center gap-3">
                        <Star size={28} /> Mastery Progress
                    </h2>
                    <div className="text-right">
                        <div className="text-3xl font-bold text-cyan-300">{progressPercent}%</div>
                        <div className="text-slate-400 text-sm">{masteredCount} / {totalItems} items</div>
                    </div>
                </div>
                <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                        role="progressbar"
                        aria-valuenow={progressPercent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                    />
                </div>

                {/* Category breakdown */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
                    {Object.entries(categoryStats).slice(0, 8).map(([cat, stats]) => (
                        <div key={cat} className="bg-slate-800/50 rounded-lg p-3">
                            <div className="text-xs text-slate-500 uppercase">{cat}</div>
                            <div className="text-slate-200 font-bold">{stats.mastered}/{stats.total}</div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Search and Filter */}
            <section className="bg-slate-900/50 rounded-xl border border-slate-700/30 p-6">
                <div className="flex flex-wrap gap-4 mb-4">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                        <input
                            type="text"
                            placeholder="Search items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-12 pr-4 py-3 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-600"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedCategory === cat
                                    ? 'bg-cyan-600 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                                    }`}
                            >
                                {cat === 'all' ? 'All' : cat}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Items List */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[60vh] overflow-y-auto">
                    {filteredItems.slice(0, 150).map(item => {
                        const mastered = masteredItems.has(item.path);
                        const imageUrl = getItemImageUrl({ uniqueName: item.path });
                        return (
                            <button
                                key={item.path}
                                onClick={() => toggleMastered(item.path)}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors text-left ${mastered
                                    ? 'bg-green-900/20 border-green-600/50 hover:bg-green-900/30'
                                    : 'bg-slate-800/30 border-slate-700/50 hover:border-cyan-600/50'
                                    }`}
                            >
                                <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${mastered ? 'bg-green-600 border-green-600' : 'border-slate-500'
                                    }`}>
                                    {mastered && <Check size={16} className="text-white" />}
                                </div>
                                {imageUrl && (
                                    <img
                                        src={imageUrl}
                                        alt=""
                                        className="w-8 h-8 object-contain rounded"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                )}
                                <div className="flex-1 min-w-0">
                                    <div className={`font-medium truncate ${mastered ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                                        {item.name}
                                    </div>
                                    <div className="text-xs text-slate-500">{item.category}</div>
                                </div>
                            </button>
                        );
                    })}
                </div>
                {filteredItems.length > 150 && (
                    <p className="text-center text-slate-500 text-sm mt-4">Showing first 150 items. Use search to find more.</p>
                )}
            </section>
        </div>
    );
}
