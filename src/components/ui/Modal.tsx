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
      <div
        className="absolute inset-0"
        onClick={onClose}
        style={{ background: "rgba(40,30,80,.40)" }}
      />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-[440px] p-6"
        style={{
          background: "rgba(255,255,255,.97)",
          border: "1px solid rgba(255,255,255,.55)",
          borderRadius: 22,
          boxShadow: "0 24px 64px rgba(70,40,140,.18), 0 4px 12px rgba(70,40,140,.06)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
