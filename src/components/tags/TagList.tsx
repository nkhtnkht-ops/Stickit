import { useState } from "react";
import { useTags, type Tag } from "@/hooks/useTags";

const TINTS = [
  { bg: "#C9F0DA", fg: "#1F5A3A" },
  { bg: "#FFD8C2", fg: "#6F3014" },
  { bg: "#C9DEFC", fg: "#1A3D80" },
  { bg: "#DAD2F5", fg: "#3A2370" },
  { bg: "#FCD2E0", fg: "#7A1E47" },
  { bg: "#FCEEB7", fg: "#6F5210" },
  { bg: "#FFCFD0", fg: "#7A1E1E" },
  { bg: "#BFE6E0", fg: "#0E4F4A" },
];

function tintFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return TINTS[hash % TINTS.length];
}

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
      <h2 className="font-display font-semibold text-[17px] text-ink mb-1">タグ</h2>
      <p className="text-[12.5px] text-ink-3 mb-4">横断的なラベル。複数プロジェクトのタスクを束ねます。</p>

      {loading ? (
        <p className="text-ink-3 text-[13px]">読み込み中…</p>
      ) : tags.length === 0 ? (
        <p className="text-ink-3 text-[13px] mb-3">タグはありません。</p>
      ) : (
        <div className="flex gap-2 flex-wrap mb-4">
          {tags.map((t) => {
            const tint = tintFor(t.name);
            return (
              <span
                key={t.id}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[12px] font-medium"
                style={{ background: tint.bg, color: tint.fg }}
              >
                #{t.name}
                <button onClick={() => handleDelete(t)} className="opacity-60 hover:opacity-100 leading-none">×</button>
              </span>
            );
          })}
        </div>
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          placeholder="新しいタグ名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 rounded-md px-3 py-2 text-[14px] outline-none"
          style={{ background: "rgba(255,255,255,.7)", border: "1px solid rgba(255,255,255,.55)" }}
        />
        <button type="submit" disabled={busy || !name.trim()} className="btn-ghost-pill disabled:opacity-50">
          ＋ 追加
        </button>
      </form>
    </div>
  );
}
