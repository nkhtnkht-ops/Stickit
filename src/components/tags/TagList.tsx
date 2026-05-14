import { useState } from "react";
import { useTags, type Tag } from "@/hooks/useTags";

export function TagList() {
  const { tags, loading, createTag, deleteTag } = useTags();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await createTag(name);
      setName("");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (t: Tag) => {
    if (confirm(`タグ「#${t.name}」を削除しますか？`)) {
      await deleteTag(t.id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[15px] font-semibold tracking-tight">タグ</h3>
      </div>
      <form onSubmit={handleAdd} className="flex gap-2 mb-3">
        <input
          placeholder="新規タグ名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 border border-border rounded px-3 py-1.5 text-[13px] focus:outline-none focus:border-ink"
        />
        <button type="submit" disabled={busy || !name.trim()} className="px-3 py-1.5 text-[12.5px] bg-ink text-white rounded font-medium hover:bg-black disabled:opacity-50">+ 追加</button>
      </form>
      {loading ? (
        <p className="text-ink-3 font-mono text-[12px]">// loading…</p>
      ) : tags.length === 0 ? (
        <p className="text-ink-3 font-mono text-[12px]">// タグはありません</p>
      ) : (
        <div className="flex gap-2 flex-wrap">
          {tags.map((t) => (
            <span key={t.id} className="inline-flex items-center gap-1.5 bg-bg-2 px-2.5 py-1 rounded text-[12px] font-medium text-ink-2">
              #{t.name}
              <button onClick={() => handleDelete(t)} className="text-ink-4 hover:text-crit">×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
