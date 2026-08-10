export type TemplateId = "empty" | "python" | "node" | "react" | "web";

export type FileSeed = Record<string, string>;

export const templates: { id: TemplateId; label: string; description: string }[] = [
  { id: "empty", label: "Empty", description: "A single README to start from" },
  { id: "python", label: "Python", description: "Package, pytest tests, requirements" },
  { id: "node", label: "Node.js", description: "TypeScript library with Vitest" },
  { id: "react", label: "React", description: "Vite + React + TS starter" },
  { id: "web", label: "HTML/CSS/JS", description: "Static site scaffold" },
];

export function templateFiles(id: TemplateId, name: string): FileSeed {
  switch (id) {
    case "python":
      return {
        "README.md": `# ${name}\n\nPython project.\n\n\`\`\`bash\npip install -r requirements.txt\npytest\n\`\`\`\n`,
        "requirements.txt": "pytest\n",
        ".gitignore": "__pycache__/\n.venv/\n*.pyc\n.env\n",
        "src/__init__.py": "",
        "src/main.py": `from src.utils import slugify\n\n\ndef main() -> None:\n    print(slugify("Hello ${name}"))\n\n\nif __name__ == "__main__":\n    main()\n`,
        "src/utils.py":
          'import re\n\n\ndef slugify(value: str) -> str:\n    """Turn a string into a url-safe slug."""\n    value = value.strip().lower()\n    return re.sub(r"[^a-z0-9]+", "-", value).strip("-")\n',
        "tests/test_utils.py":
          "from src.utils import slugify\n\n\ndef test_slugify():\n    assert slugify('Hello World') == 'hello-world'\n",
      };
    case "node":
      return {
        "README.md": `# ${name}\n\nNode + TypeScript library.\n`,
        "package.json": JSON.stringify(
          {
            name,
            version: "0.1.0",
            type: "module",
            scripts: { build: "tsc", test: "vitest run" },
            devDependencies: { typescript: "^5.5.0", vitest: "^2.0.0" },
          },
          null,
          2,
        ),
        ".gitignore": "node_modules\ndist\n.env\n",
        "src/index.ts":
          "export function sum(numbers: number[]): number {\n  return numbers.reduce((total, n) => total + n, 0);\n}\n",
        "tests/index.test.ts":
          "import { describe, expect, it } from 'vitest';\nimport { sum } from '../src/index';\n\ndescribe('sum', () => {\n  it('adds numbers', () => {\n    expect(sum([1, 2, 3])).toBe(6);\n  });\n});\n",
      };
    case "react":
      return {
        "README.md": `# ${name}\n\nVite + React + TypeScript.\n`,
        "package.json": JSON.stringify(
          {
            name,
            private: true,
            type: "module",
            scripts: { dev: "vite", build: "vite build", test: "vitest run" },
            dependencies: { react: "^19.0.0", "react-dom": "^19.0.0" },
          },
          null,
          2,
        ),
        ".gitignore": "node_modules\ndist\n.env\n",
        "index.html":
          '<!doctype html>\n<html>\n  <head><meta charset="utf-8" /><title>App</title></head>\n  <body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body>\n</html>\n',
        "src/main.tsx":
          "import { createRoot } from 'react-dom/client';\nimport App from './App';\n\ncreateRoot(document.getElementById('root')!).render(<App />);\n",
        "src/App.tsx":
          "export default function App() {\n  return <h1>Hello from " + name + "</h1>;\n}\n",
        "src/components/Header.tsx":
          "export function Header({ title }: { title: string }) {\n  return <header><h2>{title}</h2></header>;\n}\n",
      };
    case "web":
      return {
        "README.md": `# ${name}\n\nStatic site.\n`,
        "index.html":
          '<!doctype html>\n<html>\n  <head><meta charset="utf-8" /><link rel="stylesheet" href="styles.css" /><title>Site</title></head>\n  <body><h1>Hello</h1><script src="app.js"></script></body>\n</html>\n',
        "styles.css": "body { font-family: system-ui; margin: 2rem; }\n",
        "app.js": "console.log('ready');\n",
      };
    default:
      return { "README.md": `# ${name}\n\nStart building.\n` };
  }
}

/** Demo workspace with a deliberate bug for the agent to find. */
export function demoProject(): FileSeed {
  return {
    "README.md":
      "# demo-api\n\nSmall Express-style API used to try out AI Dev Studio.\n\n## Scripts\n\n- `npm test` — run the test suite\n- `npm run dev` — start the dev server\n",
    "package.json": JSON.stringify(
      {
        name: "demo-api",
        version: "1.0.0",
        type: "module",
        scripts: { dev: "node src/server.js", test: "vitest run" },
        dependencies: { express: "^4.19.2" },
        devDependencies: { vitest: "^2.0.5" },
      },
      null,
      2,
    ),
    ".gitignore": "node_modules\n.env\ndist\n",
    "src/server.js":
      "import express from 'express';\nimport { requireAuth } from './auth.js';\n\nconst app = express();\napp.use(express.json());\n\napp.get('/api/me', requireAuth, (req, res) => {\n  res.json({ user: req.user });\n});\n\napp.listen(3001, () => console.log('listening on 3001'));\n",
    "src/auth.js":
      "const SESSIONS = new Map([['abc123', { id: 1, name: 'Ada' }]]);\n\nexport function requireAuth(req, res, next) {\n  // BUG: the Authorization header arrives as `Bearer <token>`\n  const token = req.headers.authorization;\n  const user = SESSIONS.get(token);\n  if (!user) return res.status(401).json({ error: 'unauthorized' });\n  req.user = user;\n  next();\n}\n",
    "src/utils.js":
      "export function paginate(items, page = 1, perPage = 10) {\n  const start = (page - 1) * perPage;\n  return items.slice(start, start + perPage);\n}\n\nexport function formatUser(user) {\n  return { id: user.id, name: user.name };\n}\n",
    "tests/utils.test.js":
      "import { describe, expect, it } from 'vitest';\nimport { paginate } from '../src/utils.js';\n\ndescribe('paginate', () => {\n  it('slices a page', () => {\n    expect(paginate([1, 2, 3, 4], 2, 2)).toEqual([3, 4]);\n  });\n});\n",
  };
}
