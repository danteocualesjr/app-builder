export type TemplateFile = {
  path: string
  content: string
}

export const generatedAppFiles: TemplateFile[] = [
  {
    path: "package.json",
    content: JSON.stringify(
      {
        name: "generated-app",
        private: true,
        version: "0.0.0",
        packageManager: "pnpm@10.9.0",
        scripts: {
          dev: "vite",
          build: "tsc -b && vite build",
          preview: "vite preview",
        },
        dependencies: {
          "@vitejs/plugin-react": "^6.0.0",
          react: "^19.2.0",
          "react-dom": "^19.2.0",
          typescript: "^6.0.0",
          vite: "^8.0.0",
        },
        devDependencies: {
          "@types/react": "^19.2.0",
          "@types/react-dom": "^19.2.0",
        },
      },
      null,
      2
    ),
  },
  {
    path: "pnpm-workspace.yaml",
    content: `packages:
  - "."

onlyBuiltDependencies:
  - esbuild
`,
  },
  {
    path: ".gitignore",
    content: `# dependencies
node_modules

# build output
dist

# editor / OS
.DS_Store
.idea
.vscode
*.swp

# logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# env files
.env
.env*.local

# typescript
*.tsbuildinfo
`,
  },
  {
    path: "README.md",
    content: `# Generated App

This Vite + React + TypeScript app was scaffolded by the
[Cursor SDK App Builder](https://github.com/danteocualesjr/app-builder).
The dev server is already running with hot reload, so any change you
ask the agent to make is reflected in the live preview immediately.

## Scripts

- \`pnpm dev\` — start the Vite dev server
- \`pnpm build\` — type-check and produce a production build in \`dist/\`
- \`pnpm preview\` — preview the production build locally

## Project layout

\`\`\`
.
├── index.html       # Vite entrypoint
├── src/
│   ├── App.tsx      # Top-level React component
│   ├── main.tsx     # React root + StrictMode
│   └── styles.css   # Global styles (light + dark)
└── vite.config.ts
\`\`\`

Edit files directly or ask the agent to do it for you. Have fun!
`,
  },
  {
    path: "index.html",
    content: `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />
    <title>Generated App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
  },
  {
    path: "tsconfig.json",
    content: JSON.stringify(
      {
        compilerOptions: {
          target: "ES2020",
          useDefineForClassFields: true,
          lib: ["DOM", "DOM.Iterable", "ES2020"],
          allowJs: false,
          skipLibCheck: true,
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          strict: true,
          forceConsistentCasingInFileNames: true,
          module: "ESNext",
          moduleResolution: "Node",
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: "react-jsx",
        },
        include: ["src"],
      },
      null,
      2
    ),
  },
  {
    path: "vite.config.ts",
    content: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
`,
  },
  {
    path: "src/main.tsx",
    content: `import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
`,
  },
  {
    path: "src/App.tsx",
    content: `export default function App() {
  return (
    <main className="welcome">
      <div className="welcome__card">
        <span className="welcome__badge">Cursor SDK App Builder</span>
        <h1 className="welcome__title">Your live preview is ready.</h1>
        <p className="welcome__copy">
          This is a Vite + React + TypeScript starter. Open the chat and tell
          the agent what you want to build &mdash; the preview hot-reloads as
          files change.
        </p>
        <ul className="welcome__list">
          <li>
            <span className="welcome__bullet" aria-hidden="true">1</span>
            Describe the app you want in the chat.
          </li>
          <li>
            <span className="welcome__bullet" aria-hidden="true">2</span>
            Watch the agent edit files in <code>src/</code>.
          </li>
          <li>
            <span className="welcome__bullet" aria-hidden="true">3</span>
            Iterate: refine, fix, redesign &mdash; one prompt at a time.
          </li>
        </ul>
      </div>
    </main>
  );
}
`,
  },
  {
    path: "src/styles.css",
    content: `* {
  box-sizing: border-box;
}

:root {
  color-scheme: light dark;
  --bg: #ffffff;
  --fg: #171717;
  --muted: #6b7280;
  --card: #ffffff;
  --border: rgba(15, 23, 42, 0.08);
  --accent: #4f46e5;
  --accent-soft: rgba(79, 70, 229, 0.08);
  --shadow: 0 24px 60px -32px rgba(15, 23, 42, 0.25);
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg: #0b0b0f;
    --fg: #f5f5f5;
    --muted: #a1a1aa;
    --card: #14141a;
    --border: rgba(255, 255, 255, 0.08);
    --accent: #818cf8;
    --accent-soft: rgba(129, 140, 248, 0.12);
    --shadow: 0 24px 60px -32px rgba(0, 0, 0, 0.6);
  }
}

html,
body,
#root {
  min-height: 100%;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--fg);
  font-family:
    ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

.welcome {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 32px;
}

.welcome__card {
  width: 100%;
  max-width: 520px;
  padding: 32px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: var(--shadow);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.welcome__badge {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  background: var(--accent-soft);
  color: var(--accent);
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.welcome__title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.01em;
}

.welcome__copy {
  margin: 0;
  color: var(--muted);
  font-size: 15px;
  line-height: 1.55;
}

.welcome__list {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.welcome__list li {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  line-height: 1.5;
  color: var(--fg);
}

.welcome__list code {
  background: var(--accent-soft);
  color: var(--accent);
  padding: 1px 6px;
  border-radius: 4px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12.5px;
}

.welcome__bullet {
  flex-shrink: 0;
  display: inline-grid;
  place-items: center;
  width: 20px;
  height: 20px;
  margin-top: 2px;
  background: var(--accent);
  color: #ffffff;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}
`,
  },
]
