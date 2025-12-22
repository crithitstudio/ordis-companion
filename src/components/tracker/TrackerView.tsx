import { useState } from "react";
import { Package, Clock, Plus, Check, Trash2 } from "lucide-react";
import type { SavedItem } from "../../types";

export function TrackerView() {
  const [items, setItems] = useState<SavedItem[]>(() => {
    const saved = localStorage.getItem("ordis-tracker");
    return saved ? JSON.parse(saved) : [];
  });
  const [newItemName, setNewItemName] = useState("");
  const [newItemNotes, setNewItemNotes] = useState("");

  // Save to localStorage
  const saveItems = (newItems: SavedItem[]) => {
    setItems(newItems);
    localStorage.setItem("ordis-tracker", JSON.stringify(newItems));
  };

  const addItem = () => {
    if (!newItemName.trim()) return;
    const newItem: SavedItem = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      category: "Custom",
      notes: newItemNotes.trim(),
      completed: false,
      addedAt: Date.now(),
    };
    saveItems([...items, newItem]);
    setNewItemName("");
    setNewItemNotes("");
  };

  const toggleComplete = (id: string) => {
    saveItems(
      items.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item,
      ),
    );
  };

  const removeItem = (id: string) => {
    saveItems(items.filter((item) => item.id !== id));
  };

  const pendingItems = items.filter((i) => !i.completed);
  const completedItems = items.filter((i) => i.completed);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/50 rounded-xl border border-purple-900/30 p-6">
        <h2 className="text-2xl font-bold text-purple-400 mb-4 flex items-center gap-3">
          <Package size={28} /> Build Tracker
        </h2>
        <p className="text-slate-400 mb-6">
          Track items you're crafting, farming, or working towards.
        </p>

        {/* Add New Item */}
        <div className="bg-slate-800/30 rounded-lg p-4 mb-6 border border-slate-700/50">
          <h3 className="text-slate-300 font-medium mb-3">Add Item to Track</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Item name (e.g., Mesa Prime)"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Notes (optional)"
              value={newItemNotes}
              onChange={(e) => setNewItemNotes(e.target.value)}
              className="flex-1 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-slate-200 placeholder-slate-500 focus:border-purple-500 focus:outline-none"
            />
            <button
              onClick={addItem}
              disabled={!newItemName.trim()}
              className="px-6 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus size={18} /> Add
            </button>
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
              {pendingItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-slate-800/30 rounded-lg p-4 border border-slate-700/50"
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleComplete(item.id)}
                      className="p-2 rounded-full border border-slate-600 hover:border-green-500 hover:bg-green-500/10 transition-colors"
                      aria-label="Mark as complete"
                    >
                      <Check size={16} className="text-slate-500" />
                    </button>
                    <div>
                      <h4 className="text-slate-200 font-medium">
                        {item.name}
                      </h4>
                      {item.notes && (
                        <p className="text-slate-500 text-sm">{item.notes}</p>
                      )}
                    </div>
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
                  className="flex items-center justify-between bg-green-900/10 rounded-lg p-4 border border-green-900/30"
                >
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleComplete(item.id)}
                      className="p-2 rounded-full bg-green-500/20 border border-green-500"
                      aria-label="Mark as incomplete"
                    >
                      <Check size={16} className="text-green-400" />
                    </button>
                    <div>
                      <h4 className="text-slate-400 font-medium line-through">
                        {item.name}
                      </h4>
                      {item.notes && (
                        <p className="text-slate-600 text-sm">{item.notes}</p>
                      )}
                    </div>
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
