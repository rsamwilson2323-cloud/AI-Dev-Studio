import { Fragment } from "react";

type Props = { text: string; onOpenRef?: ((path: string, line?: number) => void) | undefined };

const FILE_REF = /(^|[\s(`])((?:[\w.-]+\/)*[\w.-]+\.[a-z]{1,5})(?::(\d+))?/g;

function Inline({ text, onOpenRef }: Props) {
  // inline code first
  const chunks = text.split(/(`[^`]+`)/g);
  return (
    <>
      {chunks.map((chunk, i) => {
        if (chunk.startsWith("`") && chunk.endsWith("`") && chunk.length > 2) {
          const inner = chunk.slice(1, -1);
          const match = /^((?:[\w.-]+\/)*[\w.-]+\.[a-z]{1,5})(?::(\d+))?$/.exec(inner);
          if (match && onOpenRef) {
            return (
              <button
                key={i}
                onClick={() => onOpenRef(match[1]!, match[2] ? Number(match[2]) : undefined)}
                className="rounded bg-surface-3 px-1 py-0.5 font-mono text-[11px] text-accent-glow underline decoration-dotted hover:text-primary"
              >
                {inner}
              </button>
            );
          }
          return (
            <code key={i} className="rounded bg-surface-3 px-1 py-0.5 font-mono text-[11px] text-foreground">
              {inner}
            </code>
          );
        }
        const parts: React.ReactNode[] = [];
        let last = 0;
        for (const m of chunk.matchAll(FILE_REF)) {
          const start = m.index! + m[1]!.length;
          if (!onOpenRef) break;
          parts.push(bold(chunk.slice(last, start), `${i}-t-${last}`));
          const path = m[2]!;
          const line = m[3] ? Number(m[3]) : undefined;
          parts.push(
            <button
              key={`${i}-r-${start}`}
              onClick={() => onOpenRef(path, line)}
              className="font-mono text-[11px] text-accent-glow underline decoration-dotted hover:text-primary"
            >
              {m[3] ? `${path}:${m[3]}` : path}
            </button>,
          );
          last = start + m[2]!.length + (m[3] ? m[3].length + 1 : 0);
        }
        parts.push(bold(chunk.slice(last), `${i}-end`));
        return <Fragment key={i}>{parts}</Fragment>;
      })}
    </>
  );
}

function bold(text: string, key: string) {
  const segments = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <Fragment key={key}>
      {segments.map((segment, index) =>
        segment.startsWith("**") && segment.endsWith("**") ? (
          <strong key={index} className="font-semibold text-foreground">
            {segment.slice(2, -2)}
          </strong>
        ) : (
          <Fragment key={index}>{segment}</Fragment>
        ),
      )}
    </Fragment>
  );
}

/** Compact markdown renderer tuned for agent output. */
export function Markdown({ text, onOpenRef }: Props) {
  const blocks = text.split(/```/);
  return (
    <div className="space-y-2 text-[13px] leading-relaxed text-muted-foreground">
      {blocks.map((block, index) => {
        if (index % 2 === 1) {
          const newline = block.indexOf("\n");
          const lang = newline > 0 ? block.slice(0, newline).trim() : "";
          const code = newline > 0 ? block.slice(newline + 1) : block;
          return (
            <pre
              key={index}
              className="overflow-x-auto rounded-md border border-border bg-surface-1 p-3 font-mono text-[11.5px] leading-relaxed text-foreground"
            >
              {lang ? <div className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">{lang}</div> : null}
              <code>{code.replace(/\n$/, "")}</code>
            </pre>
          );
        }
        return (
          <div key={index} className="space-y-1.5">
            {block
              .split("\n")
              .filter((line, i, arr) => !(line.trim() === "" && arr[i - 1]?.trim() === ""))
              .map((line, lineIndex) => {
                const heading = /^(#{1,4})\s+(.*)$/.exec(line);
                if (heading) {
                  return (
                    <h4 key={lineIndex} className="pt-1 text-[13px] font-semibold text-foreground">
                      <Inline text={heading[2]!} onOpenRef={onOpenRef} />
                    </h4>
                  );
                }
                const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
                if (bullet) {
                  return (
                    <div key={lineIndex} className="flex gap-2">
                      <span className="text-primary">•</span>
                      <span>
                        <Inline text={bullet[1]!} onOpenRef={onOpenRef} />
                      </span>
                    </div>
                  );
                }
                const numbered = /^\s*(\d+)\.\s+(.*)$/.exec(line);
                if (numbered) {
                  return (
                    <div key={lineIndex} className="flex gap-2">
                      <span className="font-mono text-[11px] text-primary">{numbered[1]}.</span>
                      <span>
                        <Inline text={numbered[2]!} onOpenRef={onOpenRef} />
                      </span>
                    </div>
                  );
                }
                if (!line.trim()) return <div key={lineIndex} className="h-1" />;
                return (
                  <p key={lineIndex}>
                    <Inline text={line} onOpenRef={onOpenRef} />
                  </p>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}
