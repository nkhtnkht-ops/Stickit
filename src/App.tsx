export default function App() {
  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Stickit</h1>
      <p className="font-mono text-xs text-ink-3">// design tokens loaded</p>
      <div className="flex gap-2 items-center">
        <span className="pulse-dot"></span>
        <span className="font-mono text-xs">SYNCED</span>
      </div>
      <button className="bg-ink text-white px-3 py-1.5 rounded text-sm font-medium">
        新規 <span className="font-mono text-[10px] text-white/50 ml-1 px-1 py-px rounded bg-white/10">N</span>
      </button>
    </div>
  );
}
