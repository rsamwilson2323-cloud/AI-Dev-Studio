import {
  ChevronRight,
  File,
  FileCode2,
  FileJson,
  FileText,
  Folder,
  FolderOpen,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Input } from "@/components/ui/input";
import { isIgnored, useIde } from "@/lib/ide-store";
import { importFiles, pickFiles } from "@/lib/upload";
import { toast } from "sonner";

function iconFor(path: string) {
  const ext = path.split(".").pop()?.toLowerCase();
  if (ext === "json") return FileJson;
  if (["ts", "tsx", "js", "jsx", "py", "rs", "go", "java", "css", "html"].includes(ext ?? "")) return FileCode2;
  if (["md", "txt"].includes(ext ?? "")) return FileText;
  return File;
}

type TreeNode = { name: string; path: string; type: "file" | "dir"; children: TreeNode[] };

function buildTree(paths: { path: string; type: "file" | "dir" }[]): TreeNode[] {
  const roots: TreeNode[] = [];
  const index = new Map<string, TreeNode>();
  for (const entry of [...paths].sort((a, b) => a.path.localeCompare(b.path))) {
    const parts = entry.path.split("/");
    const name = parts[parts.length - 1]!;
    const node: TreeNode = { name, path: entry.path, type: entry.type, children: [] };
    index.set(entry.path, node);
    const parentPath = parts.slice(0, -1).join("/");
    const parent = parentPath ? index.get(parentPath) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  }
  const sort = (nodes: TreeNode[]): TreeNode[] =>
    nodes
      .sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1))
      .map((node) => ({ ...node, children: sort(node.children) }));
  return sort(roots);
}

export function FileExplorer() {
  const files = useIde((s) => s.files);
  const expanded = useIde((s) => s.expanded);
  const active = useIde((s) => s.active);
  const buffers = useIde((s) => s.buffers);
  const projectName = useIde((s) => s.projectName);
  const { toggleDir, openTab, createEntry, deleteEntry, renameEntry, openFolderInTerminal } = useIde.getState();
  const [filter, setFilter] = useState("");

  const tree = useMemo(() => {
    const query = filter.trim().toLowerCase();
    const entries = Object.entries(files)
      .filter(([path]) => !isIgnored(path))
      .filter(([path, entry]) => !query || (entry.type === "file" && path.toLowerCase().includes(query)))
      .map(([path, entry]) => ({ path, type: entry.type }));
    return buildTree(entries);
  }, [files, filter]);

  function promptCreate(parent: string, type: "file" | "dir") {
    const name = window.prompt(type === "file" ? "New file path" : "New folder path", parent ? `${parent}/` : "");
    if (!name) return;
    const error = createEntry(name, type, "");
    if (error) toast.error(error);
    else if (type === "file") openTab(name.replace(/^\.?\//, ""));
  }

  async function uploadInto(parent: string, directory: boolean) {
    const picked = await pickFiles(directory);
    if (!picked || !picked.length) return;
    const report = await importFiles(picked, parent);
    if (!report.added) toast.error("Nothing imported — only text/code files under 2 MB are supported.");
    else toast.success(`Imported ${report.added} file${report.added === 1 ? "" : "s"}`);
  }

  function renderNode(node: TreeNode, depth: number) {
    const Icon = iconFor(node.path);
    const isOpen = expanded[node.path] ?? Boolean(filter.trim());
    const dirty = buffers[node.path] !== undefined;
    const parentDir = node.type === "dir" ? node.path : node.path.split("/").slice(0, -1).join("/");
    return (
      <div key={node.path}>
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <button
              onClick={() => (node.type === "dir" ? toggleDir(node.path) : openTab(node.path))}
              onDoubleClick={() => node.type === "dir" && openFolderInTerminal(node.path)}
              aria-label={node.path}
              title={node.path}
              className={`group flex w-full items-center rounded pr-2 text-left text-[12.5px] transition-colors hover:bg-surface-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                active === node.path ? "bg-surface-3 text-foreground" : "text-muted-foreground"
              }`}
            >
              {Array.from({ length: depth }).map((_, index) => (
                <span key={index} className="ml-2 h-5 w-3 shrink-0 border-l border-border/50" aria-hidden />
              ))}
              <span className="ml-2 grid h-4 w-4 shrink-0 place-items-center">
                {node.type === "dir" && <ChevronRight className={`h-3 w-3 transition-transform ${isOpen ? "rotate-90" : ""}`} />}
              </span>
              <span className="grid h-4 w-4 shrink-0 place-items-center">
                {node.type === "dir" ? (
                  isOpen ? (
                    <FolderOpen className="h-3.5 w-3.5 text-primary" />
                  ) : (
                    <Folder className="h-3.5 w-3.5 text-primary" />
                  )
                ) : (
                  <Icon className="h-3.5 w-3.5 opacity-80" />
                )}
              </span>
              <span className="ml-1.5 truncate py-[3px]">{filter.trim() && node.type === "file" ? node.path : node.name}</span>
              {dirty && <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />}
            </button>
          </ContextMenuTrigger>
          <ContextMenuContent className="w-52">
            {node.type === "file" && <ContextMenuItem onSelect={() => openTab(node.path)}>Open</ContextMenuItem>}
            <ContextMenuItem onSelect={() => openFolderInTerminal(parentDir)}>Open in Terminal</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onSelect={() => {
                const next = window.prompt("Rename to", node.path);
                if (next) renameEntry(node.path, next);
              }}
            >
              Rename
            </ContextMenuItem>
            <ContextMenuItem
              onSelect={() => {
                if (window.confirm(`Delete ${node.path}?`)) deleteEntry(node.path);
              }}
              className="text-destructive"
            >
              Delete
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onSelect={() => promptCreate(parentDir, "file")}>New File</ContextMenuItem>
            <ContextMenuItem onSelect={() => promptCreate(parentDir, "dir")}>New Folder</ContextMenuItem>
            <ContextMenuItem onSelect={() => void uploadInto(parentDir, false)}>Upload Files Here</ContextMenuItem>
            <ContextMenuItem onSelect={() => void uploadInto(parentDir, true)}>Upload Folder Here</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem
              onSelect={() => {
                void navigator.clipboard.writeText(node.path);
                toast.success("Path copied");
              }}
            >
              Copy Path
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>
        {node.type === "dir" && isOpen && node.children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="flex items-center justify-between border-b border-border px-3 py-2">
        <span className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Explorer</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => promptCreate("", "file")}
            aria-label="New file"
            title="New file"
            className="rounded p-1 text-muted-foreground hover:bg-surface-3 hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setFilter("")}
            aria-label="Refresh explorer"
            title="Refresh"
            className="rounded p-1 text-muted-foreground hover:bg-surface-3 hover:text-foreground"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="border-b border-border p-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter files"
            aria-label="Filter files"
            className="h-7 border-border bg-surface-1 pl-7 text-[12px]"
          />
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto py-1">
        {projectName && (
          <div className="px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground/70">{projectName}</div>
        )}
        {tree.map((node) => renderNode(node, 0))}
        {!tree.length && <p className="px-3 py-4 text-[12px] text-muted-foreground">No files match.</p>}
      </div>
    </div>
  );
}
