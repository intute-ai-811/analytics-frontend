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
    <div className="border border-orange-500/30 rounded-2xl bg-black/30 p-6">
      <h2 className="text-2xl font-semibold text-orange-300 text-center mb-6">
        Troubleshooting
      </h2>

      <div className="space-y-5">
        {items.map((it, idx) => (
          <div key={it.id} className="space-y-3">
            <div className="rounded-xl border-2 border-orange-500/30 bg-gray-900/40">
              <input
                value={it.problem}
                onChange={(e) =>
                  update(it.id, "problem", e.target.value)
                }
                className="w-full px-4 py-3 rounded-xl bg-transparent text-white focus:outline-none"
              />
            </div>

            <div className="rounded-xl border-2 border-orange-500/30 bg-gray-900/40">
              <textarea
                value={it.solution}
                onChange={(e) =>
                  update(it.id, "solution", e.target.value)
                }
                rows={2}
                className="w-full px-4 py-3 rounded-xl bg-transparent text-white focus:outline-none resize-y"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => removeRow(it.id)}
                className="text-xs px-3 py-1 rounded-lg border border-orange-500/30 text-orange-200 hover:bg-orange-500/10 transition"
              >
                Remove
              </button>
            </div>

            {idx < items.length - 1 && (
              <div className="h-px bg-orange-500/20" />
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 flex justify-center">
        <button
          onClick={addRow}
          className="px-5 py-2 rounded-lg bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 text-white font-medium border border-orange-500/40 shadow hover:shadow-lg hover:scale-[1.01] transition"
        >
          + Add Problem
        </button>
      </div>
    </div>
  );
}
