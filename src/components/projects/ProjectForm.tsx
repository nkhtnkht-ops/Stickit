import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import type { Project } from "@/hooks/useProjects";

const PRESET_COLORS = [
  "#7B5BFF", // primary purple
  "#7BC4E0", // sky
  "#E47B9F", // rose
  "#E8A971", // peach
  "#80C99A", // mint
  "#D9802A", // warn
  "#B83232", // crit
  "#A0A0AE", // neutral
];

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  project?: Project | null;
  onSubmit: (input: { name: string; color: string }) => Promise<void>;
};

export function ProjectForm({ open, onOpenChange, project, onSubmit }: Props) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PRESET_COLORS[0]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setName(project?.name ?? "");
      setColor(project?.color ?? PRESET_COLORS[0]);
    }
  }, [open, project]);

  const handle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onSubmit({ name: name.trim(), color });
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={() => onOpenChange(false)}>
      <h2 className="font-display text-[20px] font-semibold tracking-display text-ink mb-4">
        {project ? "プロジェクトを編集" : "新規プロジェクト"}
      </h2>
      <form onSubmit={handle} className="space-y-4">
        <input
          autoFocus
          required
          placeholder="プロジェクト名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-md px-3 py-2 text-[16px] font-medium outline-none"
          style={{ background: "rgba(255,255,255,.7)", border: "1px solid rgba(255,255,255,.55)", color: "#1A1A1F" }}
        />
        <div>
          <div className="text-[11px] font-semibold uppercase text-ink-3 mb-2" style={{ letterSpacing: "0.06em" }}>カラー</div>
          <div className="flex gap-2 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className="w-8 h-8 rounded-md transition-all"
                style={{
                  background: c,
                  boxShadow: color === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : "0 1px 3px rgba(0,0,0,.10)",
                }}
                aria-label={c}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-3">
          <button type="button" onClick={() => onOpenChange(false)} className="btn-ghost-pill">キャンセル</button>
          <button type="submit" disabled={busy} className="btn-primary disabled:opacity-50">
            {project ? "保存" : "追加"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
