import { useIde } from "./ide-store";

const TEXT_EXT =
  /\.(txt|md|markdown|json|jsonc|js|cjs|mjs|jsx|ts|tsx|py|rb|go|rs|java|kt|c|h|cpp|cs|php|sh|bash|bat|cmd|ps1|css|scss|sass|less|html|htm|xml|svg|yml|yaml|toml|ini|env|cfg|conf|lock|gitignore|sql|csv|tsv|vue|svelte|prisma|graphql|gql|dockerfile|makefile)$/i;

const SKIP = /(^|\/)(node_modules|\.git|dist|build|\.next|\.venv|__pycache__|\.cache)(\/|$)/i;
const MAX_BYTES = 2 * 1024 * 1024;

function isTextual(file: File) {
  if (TEXT_EXT.test(file.name)) return true;
  if (/^(Dockerfile|Makefile|LICENSE|README|\.env.*|\.gitignore|\.npmrc)$/i.test(file.name)) return true;
  return file.type.startsWith("text/") || file.type === "application/json";
}

function relPath(file: File) {
  const raw = (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name;
  return raw.replace(/^\/+/, "");
}

export type UploadReport = { added: number; skipped: string[]; root: string | null };

/** Reads picked files/folders into the virtual workspace, merging with existing files. */
export async function importFiles(fileList: FileList | File[], parent = ""): Promise<UploadReport> {
  const files = Array.from(fileList);
  const seed: Record<string, string> = {};
  const skipped: string[] = [];
  let root: string | null = null;
  const prefix = parent ? `${parent.replace(/\/+$/, "")}/` : "";

  for (const file of files) {
    const path = `${prefix}${relPath(file)}`;
    if (SKIP.test(path)) continue;
    if (file.size > MAX_BYTES || !isTextual(file)) {
      skipped.push(path);
      continue;
    }
    seed[path] = await file.text();
    const top = path.includes("/") ? path.split("/")[0]! : null;
    if (top && !root) root = top;
  }

  const added = useIde.getState().mergeFiles(seed, root ?? undefined);
  const first = Object.keys(seed).sort()[0];
  if (first) useIde.getState().openTab(first);
  return { added, skipped, root };
}

/** Opens a native picker. `directory` uses the folder-upload attribute. */
export function pickFiles(directory: boolean): Promise<FileList | null> {
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    if (directory) {
      input.setAttribute("webkitdirectory", "");
      input.setAttribute("directory", "");
    }
    input.onchange = () => resolve(input.files);
    input.oncancel = () => resolve(null);
    input.click();
  });
}
