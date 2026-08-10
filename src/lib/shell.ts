import { gitChanges, isIgnored, normalizePath, useIde, type Workspace } from "./ide-store";
import { diffLines } from "./diff";
import { batchLines, npmCommand, runJsFile, runPythonFile, startPreview, type Emit } from "./runtime";

export type ShellResult = { lines: { text: string; tone?: "out" | "err" | "muted" }[] };
export type ShellContext = { cwd: string; emit: Emit; setCwd: (cwd: string) => void };

const DANGEROUS = /\b(rm\s+-rf|del\s+\/|format|shutdown|reg\s+add|mkfs|dd\s+if=)/i;

export function isDangerous(command: string) {
  return DANGEROUS.test(command);
}

const HELP = [
  "Files & search:",
  "  ls [path] · cat <file> · tree · find <pattern> · grep <pattern>",
  "  mkdir <dir> · touch <file> · rm <path> · mv <from> <to> · wc <file>",
  "  cd <dir> · pwd · echo <text> > file · clear · help",
  "Run code:",
  "  node <file.js|.ts>   run JavaScript / TypeScript",
  "  python <file.py>     run Python (Pyodide)",
  "  npm install [pkg]    record dependencies in package.json",
  "  npm run <script> · npm run dev · npm start · npm test",
  "  open <file.html>     live preview (HTML + CSS + JS)",
  "  run.bat / start.sh   execute each command in the script",
  "Git:",
  "  git status · git diff [file] · git log",
];

function tree(paths: string[]) {
  return paths.map((path) => {
    const depth = path.split("/").length - 1;
    return `${"  ".repeat(depth)}${depth ? "└ " : ""}${path.split("/").pop()}`;
  });
}

export function resolvePath(cwd: string, input: string) {
  if (!input) return cwd;
  if (input.startsWith("/") || input.startsWith("~")) return normalizePath(input.replace(/^~/, ""));
  return normalizePath(`${cwd}/${input}`);
}

function splitArgs(command: string) {
  return command.match(/"[^"]*"|'[^']*'|\S+/g)?.map((part) => part.replace(/^["']|["']$/g, "")) ?? [];
}

/** Executes a command against the virtual workspace. No host process is ever spawned. */
export async function runShellCommand(command: string, context: ShellContext): Promise<void> {
  const store = useIde.getState();
  const state = useIde.getState() as Workspace;
  const { cwd, emit } = context;
  const trimmed = command.trim();
  if (!trimmed) return;

  if (/&&/.test(trimmed)) {
    for (const part of trimmed.split("&&")) await runShellCommand(part.trim(), { ...context, cwd: useIde.getState().terminals.find((t) => t.cwd !== undefined && t.cwd === cwd)?.cwd ?? cwd });
    return;
  }

  const redirect = trimmed.match(/^echo\s+(.*?)\s*>\s*(\S+)$/);
  if (redirect) {
    const text = redirect[1]!.replace(/^["']|["']$/g, "");
    const target = resolvePath(cwd, redirect[2]!);
    store.writeFile(target, `${text}\n`);
    emit(`wrote ${target}`, "muted");
    return;
  }

  const parts = splitArgs(trimmed);
  const raw = parts[0]!;
  const cmd = raw.toLowerCase();
  const args = parts.slice(1);
  const paths = store.listPaths();
  const at = (index = 0) => resolvePath(cwd, args[index] ?? "");

  /* -------- script files: run.bat, start.sh, ./run.bat -------- */
  const scriptTarget = /\.(bat|cmd|sh)$/i.test(cmd) ? resolvePath(cwd, raw) : null;
  if (scriptTarget) {
    const content = store.readFile(scriptTarget);
    if (content === null) {
      emit(`${raw}: no such file`, "err");
      return;
    }
    emit(`running ${scriptTarget}`, "muted");
    for (const line of batchLines(content)) {
      emit(`> ${line}`, "muted");
      await runShellCommand(line, context);
    }
    return;
  }

  switch (cmd) {
    case "help":
      HELP.forEach((text) => emit(text, "muted"));
      return;
    case "pwd":
      emit(`/workspace/${cwd}`.replace(/\/$/, ""));
      return;
    case "cd": {
      const target = args[0] === ".." ? cwd.split("/").slice(0, -1).join("/") : at();
      if (target && state.files[target]?.type !== "dir") {
        emit(`cd: ${args[0]}: not a directory`, "err");
        return;
      }
      context.setCwd(target);
      return;
    }
    case "ls":
    case "dir": {
      const base = at();
      const prefix = base ? `${base}/` : "";
      const names = new Set<string>();
      for (const path of Object.keys(state.files)) {
        if (isIgnored(path) || !path.startsWith(prefix)) continue;
        const rest = path.slice(prefix.length);
        if (!rest) continue;
        const head = rest.split("/")[0]!;
        names.add(state.files[prefix + head]?.type === "dir" ? `${head}/` : head);
      }
      if (!names.size) emit("no such directory", "err");
      else [...names].sort().forEach((text) => emit(text));
      return;
    }
    case "cat": {
      if (!args[0]) return emit("usage: cat <file>", "err");
      const content = store.readFile(at());
      if (content === null) return emit(`cat: ${args[0]}: no such file`, "err");
      content.split("\n").forEach((text) => emit(text));
      return;
    }
    case "tree":
      tree(paths.filter((p) => (cwd ? p.startsWith(`${cwd}/`) : true))).forEach((text) => emit(text));
      return;
    case "find": {
      const query = (args[0] ?? "").toLowerCase();
      const hits = paths.filter((path) => path.toLowerCase().includes(query));
      if (!hits.length) emit("no matches", "muted");
      else hits.forEach((text) => emit(text));
      return;
    }
    case "grep": {
      const query = args.join(" ");
      if (!query) return emit("usage: grep <pattern>", "err");
      let count = 0;
      for (const path of paths) {
        const content = store.readFile(path) ?? "";
        content.split("\n").forEach((line, index) => {
          if (count < 200 && line.toLowerCase().includes(query.toLowerCase())) {
            count += 1;
            emit(`${path}:${index + 1}: ${line.trim()}`);
          }
        });
      }
      if (!count) emit("no matches", "muted");
      return;
    }
    case "wc": {
      const content = args[0] ? store.readFile(at()) : null;
      if (content === null) return emit("usage: wc <file>", "err");
      emit(`${content.split("\n").length} ${content.split(/\s+/).filter(Boolean).length} ${content.length} ${args[0]}`);
      return;
    }
    case "mkdir": {
      if (!args[0]) return emit("usage: mkdir <dir>", "err");
      const error = store.createEntry(at(), "dir");
      emit(error ?? `created ${at()}/`, error ? "err" : "muted");
      return;
    }
    case "touch": {
      if (!args[0]) return emit("usage: touch <file>", "err");
      const error = store.createEntry(at(), "file", "");
      emit(error ?? `created ${at()}`, error ? "err" : "muted");
      return;
    }
    case "rm": {
      const target = args.filter((a) => !a.startsWith("-"))[0];
      if (!target) return emit("usage: rm [-rf] <path>", "err");
      const clean = resolvePath(cwd, target);
      if (!state.files[clean]) return emit(`rm: ${target}: not found`, "err");
      store.deleteEntry(clean);
      emit(`removed ${clean}`, "muted");
      return;
    }
    case "mv": {
      if (args.length < 2) return emit("usage: mv <from> <to>", "err");
      const from = resolvePath(cwd, args[0]!);
      if (!state.files[from]) return emit(`mv: ${args[0]}: not found`, "err");
      const to = resolvePath(cwd, args[1]!);
      store.renameEntry(from, to);
      emit(`${from} -> ${to}`, "muted");
      return;
    }
    case "clear":
      return;

    /* ------------------------------- runtimes ------------------------------ */
    case "node":
    case "bun":
    case "deno":
    case "tsx":
    case "ts-node": {
      const file = args.find((a) => !a.startsWith("-"));
      if (!file) return emit(`usage: ${cmd} <file>`, "err");
      await runJsFile(resolvePath(cwd, file), emit);
      return;
    }
    case "python":
    case "python3":
    case "py": {
      const file = args.find((a) => !a.startsWith("-"));
      if (!file) return emit("usage: python <file.py>", "err");
      await runPythonFile(resolvePath(cwd, file), emit);
      return;
    }
    case "pip":
    case "pip3": {
      emit(`pip ${args.join(" ")}: only the Python standard library is available in this workspace.`, "muted");
      return;
    }
    case "npm":
    case "pnpm":
    case "yarn":
    case "bunx":
    case "npx": {
      if (cmd === "npx" || cmd === "bunx") {
        if (/serve|http-server|vite|next/.test(args.join(" "))) return startPreview(cwd, emit);
        emit(`${cmd} ${args.join(" ")}: not available here.`, "muted");
        return;
      }
      await npmCommand(args, cwd, emit);
      return;
    }
    case "vitest":
    case "jest":
    case "pytest":
      await npmCommand(["test"], cwd, emit);
      return;
    case "open":
    case "start":
    case "serve":
    case "preview": {
      const file = args.find((a) => !a.startsWith("-"));
      startPreview(cwd, emit, file ? resolvePath(cwd, file) : undefined);
      return;
    }

    case "git": {
      const sub = args[0];
      if (sub === "status") {
        const changes = gitChanges(state);
        if (!changes.length) return emit("nothing to commit, working tree clean", "muted");
        emit("Changes:", "muted");
        changes.forEach((c) => emit(`  ${c.status} ${c.path}  +${c.additions} -${c.deletions}`));
        return;
      }
      if (sub === "diff") {
        const only = args[1] ? resolvePath(cwd, args[1]) : null;
        const changes = gitChanges(state).filter((c) => !only || c.path === only);
        if (!changes.length) return emit("no changes", "muted");
        for (const change of changes) {
          emit(`--- a/${change.path}`, "muted");
          emit(`+++ b/${change.path}`, "muted");
          for (const line of diffLines(state.baseline[change.path] ?? "", store.readFile(change.path) ?? "")) {
            if (line.type === "ctx") continue;
            emit(`${line.type === "add" ? "+" : "-"}${line.text}`, line.type === "add" ? "out" : "err");
          }
        }
        return;
      }
      if (sub === "log") {
        if (!state.commits.length) return emit("no commits yet", "muted");
        state.commits.forEach((commit) => {
          emit(`commit ${commit.id}`, "muted");
          emit(`    ${commit.message}`);
        });
        return;
      }
      emit(`git: '${sub ?? ""}' is not supported here (status, diff, log)`, "err");
      return;
    }
    default:
      emit(`${cmd}: command not found — type \`help\``, "err");
  }
}

/** Collects output instead of streaming — used by the AI agent's run_command tool. */
export async function runShellCollect(command: string, cwd = ""): Promise<ShellResult> {
  const lines: ShellResult["lines"] = [];
  let workingDir = cwd;
  await runShellCommand(command, {
    cwd,
    emit: (text, tone) => lines.push(tone ? { text, tone } : { text }),
    setCwd: (next) => {
      workingDir = next;
    },
  });
  void workingDir;
  return { lines };
}
