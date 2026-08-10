import { transform } from "sucrase";
import { normalizePath, useIde } from "./ide-store";

export type Emit = (text: string, tone?: "out" | "err" | "muted") => void;

const TEXT_EXT = ["", ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".json", "/index.js", "/index.ts"];

function read(path: string) {
  return useIde.getState().readFile(path);
}

function fmt(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) return `${value.name}: ${value.message}`;
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
}

function compile(path: string, code: string) {
  const ext = path.split(".").pop()?.toLowerCase() ?? "js";
  const transforms: ("typescript" | "jsx" | "imports")[] = ["imports"];
  if (ext === "ts" || ext === "tsx") transforms.unshift("typescript");
  if (ext === "tsx" || ext === "jsx") transforms.push("jsx");
  return transform(code, { transforms, filePath: path, production: true }).code;
}

/** Minimal CommonJS/ESM module loader over the virtual workspace. */
function createLoader(emit: Emit) {
  const cache = new Map<string, Record<string, unknown>>();

  function resolve(spec: string, fromDir: string): string | null {
    if (!spec.startsWith(".") && !spec.startsWith("/")) return null;
    const base = spec.startsWith("/") ? normalizePath(spec) : normalizePath(`${fromDir}/${spec}`);
    for (const ext of TEXT_EXT) {
      const candidate = normalizePath(base + ext);
      if (read(candidate) !== null) return candidate;
    }
    return null;
  }

  function builtin(spec: string): Record<string, unknown> | null {
    const store = useIde.getState();
    if (spec === "fs" || spec === "node:fs") {
      const fs = {
        readFileSync: (p: string) => {
          const content = read(String(p));
          if (content === null) throw new Error(`ENOENT: no such file or directory, open '${p}'`);
          return content;
        },
        writeFileSync: (p: string, data: unknown) => store.writeFile(String(p), String(data)),
        existsSync: (p: string) => read(String(p)) !== null,
        readdirSync: (p: string) => {
          const prefix = normalizePath(String(p));
          return store.listPaths().filter((f) => f.startsWith(prefix ? `${prefix}/` : ""));
        },
      };
      return { ...fs, default: fs, promises: fs };
    }
    if (spec === "path" || spec === "node:path") {
      const path = {
        join: (...parts: string[]) => normalizePath(parts.join("/")),
        resolve: (...parts: string[]) => normalizePath(parts.join("/")),
        dirname: (p: string) => p.split("/").slice(0, -1).join("/"),
        basename: (p: string) => p.split("/").pop() ?? "",
        extname: (p: string) => {
          const name = p.split("/").pop() ?? "";
          const dot = name.lastIndexOf(".");
          return dot > 0 ? name.slice(dot) : "";
        },
        sep: "/",
      };
      return { ...path, default: path };
    }
    if (spec === "os" || spec === "node:os") {
      const os = { EOL: "\n", platform: () => "browser", tmpdir: () => "/tmp" };
      return { ...os, default: os };
    }
    if (spec === "assert" || spec === "node:assert") {
      const assert = Object.assign(
        (value: unknown, message?: string) => {
          if (!value) throw new Error(message ?? "Assertion failed");
        },
        {
          equal: (a: unknown, b: unknown) => {
            if (a !== b) throw new Error(`Expected ${fmt(b)} but got ${fmt(a)}`);
          },
          deepEqual: (a: unknown, b: unknown) => {
            if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`Expected ${fmt(b)} but got ${fmt(a)}`);
          },
          ok: (value: unknown) => {
            if (!value) throw new Error("Assertion failed");
          },
        },
      );
      return { ...(assert as unknown as Record<string, unknown>), default: assert };
    }
    return null;
  }

  function load(path: string): Record<string, unknown> {
    const cached = cache.get(path);
    if (cached) return cached;
    const source = read(path);
    if (source === null) throw new Error(`Cannot find module '${path}'`);
    if (path.endsWith(".json")) {
      const parsed = { default: JSON.parse(source) } as Record<string, unknown>;
      Object.assign(parsed, JSON.parse(source));
      cache.set(path, parsed);
      return parsed;
    }
    const dir = path.split("/").slice(0, -1).join("/");
    const module = { exports: {} as Record<string, unknown> };
    cache.set(path, module.exports);

    const require = (spec: string) => {
      const local = resolve(spec, dir);
      if (local) return load(local);
      const native = builtin(spec);
      if (native) return native;
      throw new Error(`Cannot find module '${spec}' — install it with \`npm install ${spec}\` (packages are not fetched in this workspace).`);
    };

    const console_ = {
      log: (...args: unknown[]) => emit(args.map(fmt).join(" ")),
      info: (...args: unknown[]) => emit(args.map(fmt).join(" ")),
      warn: (...args: unknown[]) => emit(args.map(fmt).join(" "), "muted"),
      error: (...args: unknown[]) => emit(args.map(fmt).join(" "), "err"),
      debug: (...args: unknown[]) => emit(args.map(fmt).join(" "), "muted"),
      table: (value: unknown) => emit(fmt(value)),
    };
    const process_ = {
      argv: ["node", path],
      env: {} as Record<string, string>,
      platform: "browser",
      exit: () => undefined,
      cwd: () => "/workspace",
      stdout: { write: (text: string) => emit(String(text).replace(/\n$/, "")) },
    };

    const compiled = compile(path, source);
    const factory = new Function(
      "exports",
      "require",
      "module",
      "__filename",
      "__dirname",
      "console",
      "process",
      "globalThis_",
      `"use strict";${compiled}`,
    );
    factory(module.exports, require, module, path, dir, console_, process_, globalThis);
    cache.set(path, module.exports);
    return module.exports;
  }

  return { load, resolve };
}

export async function runJsFile(path: string, emit: Emit) {
  const clean = normalizePath(path);
  if (read(clean) === null) {
    emit(`Cannot find module '${clean}'`, "err");
    return;
  }
  const loader = createLoader(emit);
  try {
    const exports = loader.load(clean);
    const main = exports["default"] ?? exports["main"];
    if (typeof main === "function") await (main as () => unknown)();
    emit("Process exited with code 0", "muted");
  } catch (error) {
    emit(fmt(error), "err");
    if (error instanceof Error && error.stack) emit(error.stack.split("\n").slice(1, 4).join("\n"), "muted");
    emit("Process exited with code 1", "muted");
  }
}

/* ---------------------------------- Python --------------------------------- */

type Pyodide = {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (options: { batched: (text: string) => void }) => void;
  setStderr: (options: { batched: (text: string) => void }) => void;
  FS: { writeFile: (path: string, data: string) => void; mkdirTree: (path: string) => void };
};

let pyodidePromise: Promise<Pyodide> | null = null;

async function loadPyodide(emit: Emit): Promise<Pyodide> {
  if (pyodidePromise) return pyodidePromise;
  pyodidePromise = (async () => {
    emit("Starting Python runtime (first run downloads it once)…", "muted");
    const version = "0.26.4";
    await new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://cdn.jsdelivr.net/pyodide/v${version}/full/pyodide.js`;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Could not download the Python runtime."));
      document.head.appendChild(script);
    });
    const factory = (globalThis as unknown as { loadPyodide: (o: { indexURL: string }) => Promise<Pyodide> }).loadPyodide;
    const py = await factory({ indexURL: `https://cdn.jsdelivr.net/pyodide/v${version}/full/` });
    emit("Python ready.", "muted");
    return py;
  })();
  return pyodidePromise;
}

export async function runPythonFile(path: string, emit: Emit) {
  const clean = normalizePath(path);
  const code = read(clean);
  if (code === null) {
    emit(`python: can't open file '${clean}': No such file or directory`, "err");
    return;
  }
  try {
    const py = await loadPyodide(emit);
    py.setStdout({ batched: (text) => emit(text.replace(/\n$/, "")) });
    py.setStderr({ batched: (text) => emit(text.replace(/\n$/, ""), "err") });
    // mirror every python file so local imports work
    for (const file of useIde.getState().listPaths()) {
      if (!file.endsWith(".py") && !file.endsWith(".txt") && !file.endsWith(".json")) continue;
      const dir = file.split("/").slice(0, -1).join("/");
      if (dir) py.FS.mkdirTree(`/home/pyodide/${dir}`);
      py.FS.writeFile(`/home/pyodide/${file}`, read(file) ?? "");
    }
    await py.runPythonAsync(`import sys, os\nsys.path.insert(0, os.path.dirname('/home/pyodide/${clean}') or '/home/pyodide')\n`);
    await py.runPythonAsync(code);
    emit("Process exited with code 0", "muted");
  } catch (error) {
    emit(fmt(error), "err");
    emit("Process exited with code 1", "muted");
  }
}

/* --------------------------------- Preview -------------------------------- */

export function buildPreview(htmlPath: string): string | null {
  const clean = normalizePath(htmlPath);
  const html = read(clean);
  if (html === null) return null;
  const dir = clean.split("/").slice(0, -1).join("/");
  const local = (src: string) => {
    if (/^(https?:|\/\/|data:)/.test(src)) return null;
    return read(normalizePath(`${dir}/${src}`)) ?? read(normalizePath(src));
  };
  let out = html.replace(/<link[^>]*href=["']([^"']+)["'][^>]*>/gi, (match, href: string) => {
    const css = local(href);
    return css ? `<style>\n${css}\n</style>` : match;
  });
  out = out.replace(/<script([^>]*)src=["']([^"']+)["']([^>]*)><\/script>/gi, (match, _a, src: string) => {
    const js = local(src);
    if (js === null) return match;
    let code = js;
    if (/\.(ts|tsx|jsx)$/.test(src)) {
      try {
        code = transform(js, { transforms: /\.tsx?$/.test(src) ? ["typescript", "jsx"] : ["jsx"], production: true }).code;
      } catch {
        /* serve raw */
      }
    }
    return `<script>\n${code}\n</script>`;
  });
  return out;
}

function findEntryHtml(cwd: string) {
  const paths = useIde.getState().listPaths();
  const inCwd = paths.filter((p) => (cwd ? p.startsWith(`${cwd}/`) : true));
  return (
    inCwd.find((p) => p.endsWith("index.html")) ??
    inCwd.find((p) => p.endsWith(".html")) ??
    paths.find((p) => p.endsWith(".html")) ??
    null
  );
}

export function startPreview(cwd: string, emit: Emit, explicit?: string) {
  const target = explicit ? normalizePath(explicit) : findEntryHtml(cwd);
  if (!target) {
    emit("No HTML entry file found to preview.", "err");
    return;
  }
  const html = buildPreview(target);
  if (html === null) {
    emit(`Cannot read ${target}`, "err");
    return;
  }
  useIde.getState().setPreview({ path: target, html, nonce: Date.now() });
  emit(`Serving ${target} → open the Preview tab.`, "muted");
}

/* ----------------------------------- npm ---------------------------------- */

function packageJson(cwd: string) {
  const candidates = [cwd ? `${cwd}/package.json` : "package.json", "package.json"];
  for (const candidate of candidates) {
    const content = read(normalizePath(candidate));
    if (content !== null) {
      try {
        return { path: normalizePath(candidate), json: JSON.parse(content) as Record<string, any> };
      } catch {
        return { path: normalizePath(candidate), json: null };
      }
    }
  }
  return null;
}

export async function npmCommand(args: string[], cwd: string, emit: Emit) {
  const store = useIde.getState();
  const sub = (args[0] ?? "").toLowerCase();
  const pkg = packageJson(cwd);

  if (sub === "install" || sub === "i" || sub === "add" || sub === "ci") {
    const requested = args.slice(1).filter((a) => !a.startsWith("-"));
    if (!pkg) {
      emit("npm error: no package.json found in this folder.", "err");
      return;
    }
    const json = pkg.json ?? {};
    json["dependencies"] = json["dependencies"] ?? {};
    for (const name of requested) {
      const [rawName, version] = name.startsWith("@") ? [`@${name.slice(1).split("@")[0]}`, name.slice(1).split("@")[1]] : name.split("@");
      json["dependencies"][rawName!] = version ? `^${version}` : "latest";
      emit(`added ${rawName}`);
    }
    if (requested.length) store.writeFile(pkg.path, `${JSON.stringify(json, null, 2)}\n`);
    const deps = { ...(json["dependencies"] ?? {}), ...(json["devDependencies"] ?? {}) } as Record<string, string>;
    const names = Object.keys(deps);
    for (const name of names) emit(`  ${name}@${deps[name]}`, "muted");
    store.setInstalled(names);
    emit(`up to date, ${names.length} package${names.length === 1 ? "" : "s"} recorded in package.json`, "muted");
    emit("Note: this workspace resolves your own files; third-party package code is not downloaded.", "muted");
    return;
  }

  if (sub === "test" || (sub === "run" && args[1] === "test")) {
    await runTests(cwd, emit);
    return;
  }

  if (sub === "run" || sub === "start" || sub === "exec") {
    const script = sub === "start" ? "start" : (args[1] ?? "");
    const scripts = (pkg?.json?.["scripts"] ?? {}) as Record<string, string>;
    const command = scripts[script];
    if (!command && script) emit(`npm error: missing script "${script}"`, "err");
    if (command) emit(`> ${command}`, "muted");
    if (/vite|next|serve|http-server|parcel|webpack|react-scripts/.test(command ?? "") || script === "dev" || script === "start" || script === "preview") {
      startPreview(cwd, emit);
      return;
    }
    const nodeFile = command?.match(/node\s+(\S+)/)?.[1];
    if (nodeFile) {
      await runJsFile(normalizePath(`${cwd}/${nodeFile}`), emit);
      return;
    }
    if (/tsc|eslint|prettier/.test(command ?? "")) {
      emit("done", "muted");
      return;
    }
    if (!command) emit("Available scripts: " + (Object.keys(scripts).join(", ") || "none"), "muted");
    return;
  }

  emit(`npm ${sub || ""}: supported here — install, run <script>, test, start.`, "muted");
}

async function runTests(cwd: string, emit: Emit) {
  const paths = useIde.getState()
    .listPaths()
    .filter((p) => (cwd ? p.startsWith(`${cwd}/`) : true))
    .filter((p) => /\.(test|spec)\.(js|jsx|ts|tsx)$/.test(p));
  const pyTests = useIde.getState()
    .listPaths()
    .filter((p) => /(^|\/)test_[^/]+\.py$|_test\.py$/.test(p));

  if (!paths.length && !pyTests.length) {
    emit("No test files found (looked for *.test.js, *.spec.ts, test_*.py).", "err");
    return;
  }

  let passed = 0;
  let failed = 0;
  for (const path of paths) {
    emit(`RUN ${path}`, "muted");
    const cases: { name: string; fn: () => unknown }[] = [];
    const loader = createLoader(emit);
    const register = (name: string, fn: () => unknown) => cases.push({ name, fn });
    const expect = (actual: unknown) => ({
      toBe: (value: unknown) => {
        if (actual !== value) throw new Error(`expected ${fmt(value)}, received ${fmt(actual)}`);
      },
      toEqual: (value: unknown) => {
        if (JSON.stringify(actual) !== JSON.stringify(value)) throw new Error(`expected ${fmt(value)}, received ${fmt(actual)}`);
      },
      toBeTruthy: () => {
        if (!actual) throw new Error(`expected truthy, received ${fmt(actual)}`);
      },
      toBeFalsy: () => {
        if (actual) throw new Error(`expected falsy, received ${fmt(actual)}`);
      },
      toContain: (value: unknown) => {
        if (!String(actual).includes(String(value))) throw new Error(`expected ${fmt(actual)} to contain ${fmt(value)}`);
      },
    });
    const globals = globalThis as unknown as Record<string, unknown>;
    const saved = { test: globals["test"], it: globals["it"], describe: globals["describe"], expect: globals["expect"] };
    globals["test"] = register;
    globals["it"] = register;
    globals["describe"] = (_name: string, fn: () => void) => fn();
    globals["expect"] = expect;
    try {
      loader.load(path);
      for (const testCase of cases) {
        try {
          await testCase.fn();
          passed += 1;
          emit(`  ✓ ${testCase.name}`);
        } catch (error) {
          failed += 1;
          emit(`  ✗ ${testCase.name} — ${fmt(error)}`, "err");
        }
      }
    } catch (error) {
      failed += 1;
      emit(`  ✗ ${path} failed to load — ${fmt(error)}`, "err");
    } finally {
      Object.assign(globals, saved);
    }
  }

  for (const path of pyTests) {
    emit(`RUN ${path}`, "muted");
    await runPythonFile(path, emit);
  }

  emit(`Tests: ${passed} passed, ${failed} failed`, failed ? "err" : "muted");
}

/* --------------------------------- run.bat -------------------------------- */

export function batchLines(content: string) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !/^(@?echo\b|rem\b|::|pause|setlocal|endlocal|title\b|cls$|exit\b)/i.test(line))
    .map((line) => line.replace(/^@/, "").replace(/^call\s+/i, "").replace(/^start\s+(""\s+)?/i, "start "))
    .filter(Boolean);
}
