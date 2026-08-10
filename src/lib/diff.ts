export type DiffLine = {
  type: "add" | "del" | "ctx";
  text: string;
  oldNo: number | null;
  newNo: number | null;
};

/** Simple LCS-based line diff (good enough for review-sized files). */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = before.length ? before.split("\n") : [];
  const b = after.length ? after.split("\n") : [];
  const n = a.length;
  const m = b.length;

  // LCS table (capped to keep it cheap on huge files)
  const table: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[i]![j] = a[i] === b[j] ? table[i + 1]![j + 1]! + 1 : Math.max(table[i + 1]![j]!, table[i]![j + 1]!);
    }
  }

  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ type: "ctx", text: a[i]!, oldNo: i + 1, newNo: j + 1 });
      i++;
      j++;
    } else if (table[i + 1]![j]! >= table[i]![j + 1]!) {
      out.push({ type: "del", text: a[i]!, oldNo: i + 1, newNo: null });
      i++;
    } else {
      out.push({ type: "add", text: b[j]!, oldNo: null, newNo: j + 1 });
      j++;
    }
  }
  while (i < n) {
    out.push({ type: "del", text: a[i]!, oldNo: i + 1, newNo: null });
    i++;
  }
  while (j < m) {
    out.push({ type: "add", text: b[j]!, oldNo: null, newNo: j + 1 });
    j++;
  }
  return out;
}

export function diffStat(before: string, after: string) {
  let additions = 0;
  let deletions = 0;
  for (const line of diffLines(before, after)) {
    if (line.type === "add") additions++;
    if (line.type === "del") deletions++;
  }
  return { additions, deletions };
}

/** Collapse unchanged runs so long files stay readable. */
export function collapseDiff(lines: DiffLine[], context = 3): (DiffLine | { type: "gap"; count: number })[] {
  const keep = new Set<number>();
  lines.forEach((line, index) => {
    if (line.type === "ctx") return;
    for (let k = index - context; k <= index + context; k++) keep.add(k);
  });
  const out: (DiffLine | { type: "gap"; count: number })[] = [];
  let gap = 0;
  lines.forEach((line, index) => {
    if (keep.has(index)) {
      if (gap) {
        out.push({ type: "gap", count: gap });
        gap = 0;
      }
      out.push(line);
    } else {
      gap++;
    }
  });
  if (gap) out.push({ type: "gap", count: gap });
  return out;
}
