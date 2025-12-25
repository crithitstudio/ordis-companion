import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import {
  Package,
  Clock,
  Plus,
  Check,
  Trash2,
  GripVertical,
  Tag,
  ChevronUp,
  ChevronDown,
  Filter,
  Star,
  ChevronRight,
  Wrench,
  Search,
  X,
  CheckCheck,
  XCircle,
  Download,
  Upload,
} from "lucide-react";
import { useToast } from "../ui";
import { itemsData } from "../../utils/translations";
import type { SavedItem, ItemComponent } from "../../types";

// Extended SavedItem with priority and component progress
interface TrackerItem extends SavedItem {
  priority?: "high" | "medium" | "low";
  tags?: string[];
  componentProgress?: Record<string, boolean>; // component name => completed
}

// Get components for an item from itemsData
function getItemComponents(itemName: string): ItemComponent[] {
  const item = Object.values(itemsData).find(
    (i) => i.name?.toLowerCase() === itemName.toLowerCase(),
  );
  return item?.components || [];
}

const PRIORITY_COLORS = {
  high: "border-red-500/50 bg-red-900/10",
  medium: "border-yellow-500/50 bg-yellow-900/10",
  low: "border-slate-700/50 bg-slate-800/30",
};

const PRIORITY_LABELS = {
  high: "High Priority",
  medium: "Medium",
  low: "Low",
};

const SUGGESTED_TAGS = [
  "Warframe",
  "Prime",
  "Weapon",
  "Mod",
  "Resource",
  "Quest",
  "Nightwave",
];

export function TrackerView() {
  const { addToast } = useToast();

  const [items, setItems] = useState<TrackerItem[]>(() => {
    const saved = localStorage.getItem("ordis-tracker");
    return saved ? JSON.parse(saved) : [];
  });
  const [newItemName, setNewItemName] = useState("");
  const [newItemNotes, setNewItemNotes] = useState("");
  const [newItemPriority, setNewItemPriority] = useState<
    "high" | "medium" | "low"
  >("medium");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Filter state
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Autocomplete state
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Get all item names for autocomplete (deduplicated)
  const allItemNames = useMemo(() => {
    const seen = new Set<string>();
    return Object.values(itemsData)
      .filter((item) => {
        if (!item.name || seen.has(item.name)) return false;
        seen.add(item.name);
        return true;
      })
      .map((item) => ({
        name: item.name!,
        type: item.type || item.category || "Unknown",
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  // Filter suggestions based on input
  const suggestions = useMemo(() => {
    if (newItemName.length < 2) return [];
    const query = newItemName.toLowerCase();
    return allItemNames
      .filter((item) => item.name.toLowerCase().includes(query))
      .slice(0, 8);
  }, [allItemNames, newItemName]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Save to localStorage
  const saveItems = useCallback((newItems: TrackerItem[]) => {
    setItems(newItems);
    localStorage.setItem("ordis-tracker", JSON.stringify(newItems));
  }, []);

  const addItem = useCallback(() => {
    if (!newItemName.trim()) return;
    const newItem: TrackerItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      category: selectedTags.length > 0 ? selectedTags[0] : "Custom",
      notes: newItemNotes.trim(),
      completed: false,
      addedAt: Date.now(),
      priority: newItemPriority,
      tags: selectedTags,
    };
    saveItems([...items, newItem]);
    setNewItemName("");
    setNewItemNotes("");
    setSelectedTags([]);
    addToast(`Added "${newItem.name}" to tracker`, "success");
  }, [
    newItemName,
    newItemNotes,
    newItemPriority,
    selectedTags,
    items,
    saveItems,
    addToast,
  ]);

  const toggleComplete = useCallback(
    (id: string) => {
      const item = items.find((i) => i.id === id);
      saveItems(
        items.map((item) =>
          item.id === id ? { ...item, completed: !item.completed } : item,
        ),
      );
      if (item && !item.completed) {
        addToast(`Completed "${item.name}"!`, "success");
      }
    },
    [items, saveItems, addToast],
  );

  const removeItem = useCallback(
    (id: string) => {
      const item = items.find((i) => i.id === id);
      saveItems(items.filter((item) => item.id !== id));
      if (item) {
        addToast(`Removed "${item.name}"`, "info");
      }
    },
    [items, saveItems, addToast],
  );

  const moveItem = useCallback(
    (id: string, direction: "up" | "down") => {
      const index = items.findIndex((i) => i.id === id);
      if (index === -1) return;

      const newIndex = direction === "up" ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= items.length) return;

      const newItems = [...items];
      [newItems[index], newItems[newIndex]] = [
        newItems[newIndex],
        newItems[index],
      ];
      saveItems(newItems);
    },
    [items, saveItems],
  );

  const updatePriority = useCallback(
    (id: string, priority: "high" | "medium" | "low") => {
      saveItems(
        items.map((item) => (item.id === id ? { ...item, priority } : item)),
      );
    },
    [items, saveItems],
  );

  // Toggle component completion
  const toggleComponent = useCallback(
    (itemId: string, componentName: string) => {
      saveItems(
        items.map((item) => {
          if (item.id !== itemId) return item;
          const progress = { ...(item.componentProgress || {}) };
          progress[componentName] = !progress[componentName];
          return { ...item, componentProgress: progress };
        }),
      );
    },
    [items, saveItems],
  );

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  // Filter and sort items
  const { pendingItems, completedItems, progressPercent } = useMemo(() => {
    let filtered = items;

    if (filterPriority !== "all") {
      filtered = filtered.filter((i) => i.priority === filterPriority);
    }

    // Sort by priority within each group
    const priorityOrder = { high: 0, medium: 1, low: 2, undefined: 3 };
    const sortByPriority = (a: TrackerItem, b: TrackerItem) => {
      return (
        (priorityOrder[a.priority || "low"] || 3) -
        (priorityOrder[b.priority || "low"] || 3)
      );
    };

    const pending = filtered.filter((i) => !i.completed).sort(sortByPriority);
    const completed = filtered.filter((i) => i.completed);
    const total = pending.length + completed.length;
    const percent =
      total > 0 ? Math.round((completed.length / total) * 100) : 0;

    return {
      pendingItems: pending,
      completedItems: completed,
      progressPercent: percent,
    };
  }, [items, filterPriority]);

  // Bulk actions
  const completeAllItems = useCallback(() => {
    if (pendingItems.length === 0) return;
    saveItems(items.map((item) => ({ ...item, completed: true })));
    addToast(
      `Completed ${pendingItems.length} ${pendingItems.length === 1 ? "item" : "items"}!`,
      "success",
    );
  }, [items, pendingItems.length, saveItems, addToast]);

  const clearCompletedItems = useCallback(() => {
    if (completedItems.length === 0) return;
    const count = completedItems.length;
    saveItems(items.filter((item) => !item.completed));
    addToast(
      `Cleared ${count} completed ${count === 1 ? "item" : "items"}`,
      "info",
    );
  }, [items, completedItems.length, saveItems, addToast]);

  // Export data
  const exportData = useCallback(() => {
    const data = {
      tracker: items,
      exportedAt: new Date().toISOString(),
      version: 1,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ordis-tracker-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast("Tracker data exported!", "success");
  }, [items, addToast]);

  // Import data
  const importData = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          if (data.tracker && Array.isArray(data.tracker)) {
            saveItems(data.tracker);
            addToast(`Imported ${data.tracker.length} items!`, "success");
          } else {
            addToast("Invalid file format", "error");
          }
        } catch {
          addToast("Failed to parse file", "error");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }, [saveItems, addToast]);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 rounded-xl border border-purple-900/30 p-6">
        <h2 className="text-2xl font-bold text-purple-400 mb-4 flex items-center gap-3">
          <Package size={28} /> Build Tracker
          <span className="text-sm font-normal text-slate-500 ml-auto flex items-center gap-3">
            <span className="text-cyan-400 font-medium">
              {progressPercent}%
            </span>
            <span>
              {pendingItems.length} pending, {completedItems.length} done
            </span>
            <button
              onClick={exportData}
              className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
              title="Export Data"
            >
              <Download size={14} />
            </button>
            <button
              onClick={importData}
              className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded text-slate-300"
              title="Import Data"
            >
              <Upload size={14} />
            </button>
          </span>
        </h2>

        {/* Progress Bar */}
        {items.length > 0 && (
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-gradient-to-r from-purple-600 to-cyan-500 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        <p className="text-slate-400 mb-6">
          Track items you're crafting, farming, or working towards. Set
          priorities and organize with tags.
        </p>

        {/* Add New Item */}
        <div className="bg-slate-800/30 rounded-lg p-4 mb-6 border border-slate-700/50">
          <h3 className="text-slate-300 font-medium mb-3">Add Item to Track</h3>

          {/* Name and Notes */}
          <div className="flex flex-col sm:flex-row gap-3 mb-3">
            <div ref={searchRef} className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                size={18}
              />
              <input
                type="text"
                placeholder="Item name (e.g., Mesa Prime)"
                value={newItemName}
                onChange={(e) => {
                  setNewItemName(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={(e) => e.key === "Enter" && addItem()}
                className="w-full pl-10 pr-10 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
              />
              {newItemName && (
                <button
                  onClick={() => {
                    setNewItemName("");
                    setShowSuggestions(false);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X size={16} />
                </button>
              )}

              {/* Suggestions Dropdown */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-20 max-h-48 overflow-y-auto">
                  {suggestions.map((item, idx) => (
                    <button
                      key={`${item.name}-${idx}`}
                      onClick={() => {
                        setNewItemName(item.name);
                        setShowSuggestions(false);
                      }}
                      className="w-full px-4 py-2 flex items-center justify-between hover:bg-slate-700 transition-colors text-left border-b border-slate-700/50 last:border-0"
                    >
                      <span className="text-slate-200">{item.name}</span>
                      <span className="text-xs text-slate-500">
                        {item.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <input
              type="text"
              placeholder="Notes (optional)"
              value={newItemNotes}
              onChange={(e) => setNewItemNotes(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
            />
          </div>

          {/* Priority and Tags */}
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              <Star size={16} className="text-slate-400" />
              <span className="text-sm text-slate-400">Priority:</span>
              {(["high", "medium", "low"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setNewItemPriority(p)}
                  className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                    newItemPriority === p
                      ? p === "high"
                        ? "bg-red-600 text-white"
                        : p === "medium"
                          ? "bg-yellow-600 text-white"
                          : "bg-slate-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tag Selection */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Tag size={16} className="text-slate-400" />
            <span className="text-sm text-slate-400">Tags:</span>
            {SUGGESTED_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-2 py-0.5 rounded text-xs transition-colors ${
                  selectedTags.includes(tag)
                    ? "bg-purple-600 text-white"
                    : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Add Button */}
          <button
            onClick={addItem}
            disabled={!newItemName.trim()}
            className="w-full sm:w-auto px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={18} /> Add Item
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              showFilters
                ? "bg-purple-600 text-white"
                : "bg-slate-800 text-slate-400 hover:bg-slate-700"
            }`}
          >
            <Filter size={16} /> Filters
          </button>
          {showFilters && (
            <div className="flex gap-2">
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200"
              >
                <option value="all">All Priorities</option>
                <option value="high">High Only</option>
                <option value="medium">Medium Only</option>
                <option value="low">Low Only</option>
              </select>
            </div>
          )}

          {/* Bulk Actions */}
          <div className="flex items-center gap-2 ml-auto">
            {pendingItems.length > 0 && (
              <button
                onClick={completeAllItems}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-lg text-sm transition-colors"
                aria-label="Complete all pending items"
              >
                <CheckCheck size={16} /> Complete All
              </button>
            )}
            {completedItems.length > 0 && (
              <button
                onClick={clearCompletedItems}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg text-sm transition-colors"
                aria-label="Clear completed items"
              >
                <XCircle size={16} /> Clear Done
              </button>
            )}
          </div>
        </div>

        {/* Pending Items */}
        <div className="mb-6">
          <h3 className="text-slate-300 font-medium mb-3 flex items-center gap-2">
            <Clock size={18} /> In Progress ({pendingItems.length})
          </h3>
          {pendingItems.length === 0 ? (
            <p className="text-slate-500 text-center py-4">
              No items being tracked. Add something above or from the Codex!
            </p>
          ) : (
            <div className="space-y-2">
              {pendingItems.map((item, idx) => {
                const components = getItemComponents(item.name);
                const completedCount = components.filter(
                  (c) => item.componentProgress?.[c.name],
                ).length;
                return (
                  <div key={item.id} className="space-y-2">
                    <div
                      className={`flex items-center gap-2 rounded-lg p-4 border transition-all hover-lift ${PRIORITY_COLORS[item.priority || "low"]}`}
                    >
                      {/* Reorder Buttons */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          onClick={() => moveItem(item.id, "up")}
                          disabled={idx === 0}
                          className="p-0.5 text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:hover:text-slate-500"
                          aria-label="Move up"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          onClick={() => moveItem(item.id, "down")}
                          disabled={idx === pendingItems.length - 1}
                          className="p-0.5 text-slate-500 hover:text-slate-300 disabled:opacity-30 disabled:hover:text-slate-500"
                          aria-label="Move down"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>

                      <GripVertical size={16} className="text-slate-600" />

                      {/* Complete Button */}
                      <button
                        onClick={() => toggleComplete(item.id)}
                        className="p-2 rounded-full border border-slate-600 hover:border-green-500 hover:bg-green-500/10 transition-colors"
                        aria-label="Mark as complete"
                      >
                        <Check size={16} className="text-slate-500" />
                      </button>

                      {/* Item Info */}
                      <div className="flex-1 min-w-0">
                        <h4 className="text-slate-200 font-medium truncate">
                          {item.name}
                        </h4>
                        <div className="flex items-center gap-2 text-xs">
                          {item.priority && (
                            <span
                              className={`${
                                item.priority === "high"
                                  ? "text-red-400"
                                  : item.priority === "medium"
                                    ? "text-yellow-400"
                                    : "text-slate-500"
                              }`}
                            >
                              {PRIORITY_LABELS[item.priority]}
                            </span>
                          )}
                          {item.tags && item.tags.length > 0 && (
                            <span className="text-purple-400">
                              {item.tags.join(", ")}
                            </span>
                          )}
                          {item.notes && (
                            <span className="text-slate-500 truncate">
                              · {item.notes}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Component Button (if item has components) */}
                      {components.length > 0 && (
                        <button
                          onClick={() =>
                            setExpandedItemId(
                              expandedItemId === item.id ? null : item.id,
                            )
                          }
                          className="flex items-center gap-1 px-2 py-1 bg-slate-700/50 hover:bg-slate-700 rounded text-xs text-slate-300 transition-colors"
                        >
                          <Wrench size={12} />
                          {completedCount}/{components.length}
                          <ChevronRight
                            size={12}
                            className={`transition-transform ${expandedItemId === item.id ? "rotate-90" : ""}`}
                          />
                        </button>
                      )}

                      {/* Priority Selector */}
                      <select
                        value={item.priority || "low"}
                        onChange={(e) =>
                          updatePriority(
                            item.id,
                            e.target.value as "high" | "medium" | "low",
                          )
                        }
                        className="px-2 py-1 bg-slate-800 border border-slate-700 rounded text-xs text-slate-300"
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>

                      {/* Delete Button */}
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>

                    {/* Expanded Component Breakdown */}
                    {expandedItemId === item.id && components.length > 0 && (
                      <div className="ml-8 p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                        <h5 className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-2">
                          <Wrench size={12} /> Required Components
                        </h5>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                          {components.map((comp) => {
                            const completed =
                              item.componentProgress?.[comp.name] || false;
                            return (
                              <button
                                key={comp.name}
                                onClick={() =>
                                  toggleComponent(item.id, comp.name)
                                }
                                className={`flex items-center gap-2 p-2 rounded text-xs transition-colors ${
                                  completed
                                    ? "bg-green-900/30 text-green-400 border border-green-600/30"
                                    : "bg-slate-800/50 text-slate-400 border border-slate-700/50 hover:border-slate-600"
                                }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${
                                    completed
                                      ? "bg-green-600 border-green-600"
                                      : "border-slate-600"
                                  }`}
                                >
                                  {completed && (
                                    <Check size={10} className="text-white" />
                                  )}
                                </div>
                                <span className="truncate">{comp.name}</span>
                                {comp.count > 1 && (
                                  <span className="text-slate-500">
                                    x{comp.count}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Completed Items */}
        {completedItems.length > 0 && (
          <div>
            <h3 className="text-slate-300 font-medium mb-3 flex items-center gap-2">
              <Check size={18} className="text-green-400" /> Completed (
              {completedItems.length})
            </h3>
            <div className="space-y-2">
              {completedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 bg-green-900/10 rounded-lg p-4 border border-green-900/30"
                >
                  <button
                    onClick={() => toggleComplete(item.id)}
                    className="p-2 rounded-full bg-green-500/20 border border-green-500"
                    aria-label="Mark as incomplete"
                  >
                    <Check size={16} className="text-green-400" />
                  </button>
                  <div className="flex-1">
                    <h4 className="text-slate-400 font-medium line-through">
                      {item.name}
                    </h4>
                    {item.notes && (
                      <p className="text-slate-600 text-sm">{item.notes}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
