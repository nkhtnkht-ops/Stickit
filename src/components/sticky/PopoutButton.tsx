type Props = { projectId: string | "all" };

export function PopoutButton({ projectId }: Props) {
  const open = () => {
    const url = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/popout?project=${encodeURIComponent(projectId)}`;
    window.open(url, "stickit-popout", "width=320,height=480,resizable=yes,scrollbars=yes");
  };
  return (
    <button onClick={open} className="px-3 py-1.5 text-[12.5px] font-medium bg-surface border border-border rounded text-ink-2 hover:border-ink-5 inline-flex items-center gap-1.5">
      <svg className="w-3.5 h-3.5 stroke-current fill-none" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M9 21H3v-6M21 9V3h-6M21 3l-7 7M3 21l7-7"/></svg>
      ポップアウト
    </button>
  );
}
