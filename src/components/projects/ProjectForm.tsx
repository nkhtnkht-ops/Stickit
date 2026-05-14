import { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import type { Project } from "@/hooks/useProjects";

const PRESET_COLORS = [
  "#00C853", "#EF4444", "#F97316", "#3B82F6", "#8B5CF6",
  "#EC4899", "#94A3B8", "#0A0A0A",
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
      <div className="font-mono text-[12px] uppercase tracking-wider text-ink-4 mb-1">// {project ? "edit project" : "new project"}</div>
      <h2 className="text-[21px] font-semibold tracking-[-0.02em] mb-3">{project ? "プロジェクトを編集" : "新規プロジェクト"}</h2>
      <form onSubmit={handle} className="space-y-3">
        <input
          autoFocus
          required
          placeholder="プロジェクト名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-border rounded px-3 py-2 text-[16px] focus:outline-none focus:border-ink focus:ring-2 focus:ring-black/5"
        />
        <div>
          <div className="font-mono text-[12px] uppercase tracking-wider text-ink-3 mb-2">// カラー</div>
          <div className="flex gap-2 flex-wrap">
            {PRESET_COLORS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className={`w-7 h-7 rounded ${color === c ? "ring-2 ring-offset-2 ring-ink" : ""}`}
                style={{ background: c }}
                aria-label={c}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => onOpenChange(false)} className="px-3 py-1.5 text-[14px] text-ink-2 hover:bg-bg-2 rounded font-medium">キャンセル</button>
          <button type="submit" disabled={busy} className="px-3 py-1.5 text-[14px] bg-ink text-white rounded font-medium hover:bg-black disabled:opacity-50">{project ? "保存" : "追加"}</button>
        </div>
      </form>
    </Modal>
  );
}
