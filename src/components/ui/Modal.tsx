import { ReactNode, useEffect } from "react";

type Props = { open: boolean; onClose: () => void; children: ReactNode };

export function Modal({ open, onClose, children }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div role="dialog" aria-modal="true" className="relative bg-surface border border-border rounded-lg shadow-xl w-full max-w-[420px] p-5">
        {children}
      </div>
    </div>
  );
}
