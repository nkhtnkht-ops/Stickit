import { ProjectList } from "@/components/projects/ProjectList";

export default function Settings() {
  return (
    <div className="p-8 max-w-2xl">
      <div className="font-mono text-[10.5px] text-ink-3 mb-2">// settings</div>
      <h1 className="text-[28px] font-semibold tracking-[-0.025em] leading-tight mb-6">設定</h1>
      <div className="space-y-8">
        <section>
          <ProjectList />
        </section>
      </div>
    </div>
  );
}
