import { collapseDiff, diffLines } from "@/lib/diff";

export function DiffView({ before, after, className = "" }: { before: string; after: string; className?: string }) {
  const rows = collapseDiff(diffLines(before, after));
  return (
    <div className={`overflow-auto rounded-md border border-border bg-surface-1 font-mono text-[11.5px] leading-[1.55] ${className}`}>
      {rows.map((row, index) => {
        if (row.type === "gap") {
          return (
            <div key={index} className="bg-surface-2/60 px-3 py-0.5 text-[10px] text-muted-foreground">
              ⋯ {row.count} unchanged {row.count === 1 ? "line" : "lines"}
            </div>
          );
        }
        const tone =
          row.type === "add"
            ? "bg-diff-add/12 text-diff-add"
            : row.type === "del"
              ? "bg-diff-del/12 text-diff-del"
              : "text-muted-foreground";
        return (
          <div key={index} className={`flex gap-3 px-2 ${tone}`}>
            <span className="w-8 shrink-0 select-none text-right text-[10px] opacity-50">{row.oldNo ?? ""}</span>
            <span className="w-8 shrink-0 select-none text-right text-[10px] opacity-50">{row.newNo ?? ""}</span>
            <span className="w-3 shrink-0 select-none">{row.type === "add" ? "+" : row.type === "del" ? "-" : " "}</span>
            <span className="whitespace-pre-wrap break-all">{row.text || " "}</span>
          </div>
        );
      })}
      {!rows.length && <div className="px-3 py-2 text-muted-foreground">No differences.</div>}
    </div>
  );
}
