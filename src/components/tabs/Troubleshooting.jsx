import React, { useState } from "react";

/* ========================= TROUBLESHOOTING ========================= */
export default function Troubleshooting() {
  const [items, setItems] = useState([
    { id: 1, problem: "Problem #1", solution: "Solution #1" },
    { id: 2, problem: "Problem #2", solution: "Solution #2" },
    { id: 3, problem: "Problem #3", solution: "Solution #3" },
  ]);

  const update = (id, field, value) =>
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, [field]: value } : it))
    );

  const addRow = () =>
    setItems((prev) => [
      ...prev,
      {
        id: Date.now(),
        problem: `Problem #${prev.length + 1}`,
        solution: `Solution #${prev.length + 1}`,
      },
    ]);

  const removeRow = (id) =>
    setItems((prev) => prev.filter((it) => it.id !== id));

  return (
    <div className="space-y-6 pb-8">
      {/* ===== TITLE ===== */}
      <h2 className="text-2xl font-bold text-center bg-gradient-to-r from-brand-400 via-brand-500 to-amber-500 bg-clip-text text-transparent mb-3">
        Troubleshooting
      </h2>

      {/* ===== GUIDE LIST ===== */}
      <div className="bg-gradient-to-br from-gray-900/90 to-black/80 rounded-xl border border-brand-500/30 overflow-hidden shadow-lg">
        {/* Header */}
        <div className="px-6 py-4 bg-gray-900/60 border-b border-brand-500/20 flex justify-between items-center">
          <div className="text-brand-300 font-medium">
            <span className="text-brand-400 font-bold">{items.length}</span> issue{items.length !== 1 ? "s" : ""} documented
          </div>

          <button
            onClick={addRow}
            className="px-5 py-2 bg-gradient-to-r from-brand-600 to-accent-600 text-white rounded-lg font-semibold shadow-md hover:shadow-lg hover:scale-105 transition-all text-sm"
          >
            + Add Problem
          </button>
        </div>

        {/* Entries */}
        <div className="divide-y divide-brand-500/10">
          {items.length === 0 ? (
            <div className="px-6 py-16 text-center text-brand-300/70">
              No troubleshooting entries yet. Use “+ Add Problem” to create one.
            </div>
          ) : (
            items.map((it, idx) => (
              <div key={it.id} className="px-6 py-5 hover:bg-brand-500/5 transition-all space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-brand-400" />
                    <span className="font-semibold text-brand-100 text-lg">
                      Issue {idx + 1}
                    </span>
                  </div>
                  <button
                    onClick={() => removeRow(it.id)}
                    className="text-xs px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 hover:bg-red-500/30 transition"
                  >
                    Remove
                  </button>
                </div>

                <div>
                  <label className="block text-brand-300 text-sm font-medium mb-1.5">Problem</label>
                  <input
                    value={it.problem}
                    onChange={(e) => update(it.id, "problem", e.target.value)}
                    className="w-full bg-gray-900/80 border border-brand-500/40 text-brand-200 rounded-lg px-4 py-2 focus:border-brand-500 focus:outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-brand-300 text-sm font-medium mb-1.5">Solution</label>
                  <textarea
                    value={it.solution}
                    onChange={(e) => update(it.id, "solution", e.target.value)}
                    rows={2}
                    className="w-full bg-gray-900/80 border border-brand-500/40 text-brand-200 rounded-lg px-4 py-2 focus:border-brand-500 focus:outline-none transition resize-y"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
