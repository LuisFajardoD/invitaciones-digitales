import { promises as fs } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SKIP_DIRS = ["node_modules", ".next", "dist", "build", "out", "coverage"];

const includeCss = (filePath) => filePath.endsWith(".css");
const shouldSkip = (filePath) => SKIP_DIRS.some((dir) => filePath.includes(`${path.sep}${dir}${path.sep}`));

const readFiles = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const resolved = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (shouldSkip(resolved)) {
        continue;
      }
      files.push(...(await readFiles(resolved)));
    } else if (includeCss(resolved)) {
      files.push(resolved);
    }
  }
  return files;
};

const violations = [];

const report = (file, rule, line, snippet) => {
  violations.push({ file, rule, line, snippet });
};

const checkRules = (filePath, content) => {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, "/");
  const lines = content.split(/\r?\n/);

  const findLine = (matcher) => {
    for (let i = 0; i < lines.length; i += 1) {
      if (matcher(lines[i])) {
        return { line: i + 1, snippet: lines[i].trim() };
      }
    }
    return null;
  };

  if (rel !== "shared/ui/tokens.css") {
    ["html.theme-dark", "html.theme-light"].forEach((token) => {
      if (content.includes(token)) {
        const match = findLine((line) => line.includes(token));
        report(rel, `"${token}" permitted only in shared/ui/tokens.css`, match?.line ?? 0, match?.snippet ?? token);
      }
    });
  }

  if (rel !== "shared/ui/components.css") {
    [".button-primary", ".button-secondary", ".button-ghost", ".ghost-link"].forEach((selector) => {
      if (content.includes(selector)) {
        const match = findLine((line) => line.includes(selector));
        report(rel, `${selector} only allowed in shared/ui/components.css`, match?.line ?? 0, match?.snippet ?? selector);
      }
    });
  }

  if (rel !== "shared/ui/base.css") {
    const resetMatchers = [
      { name: '"* {"', regex: /^\s*\*\s*\{/ },
      { name: '"html {"', regex: /^\s*html\s*\{/ },
      { name: '"body {"', regex: /^\s*body\s*\{/ },
    ];
    resetMatchers.forEach(({ name, regex }) => {
      const match = findLine((line) => regex.test(line));
      if (match) {
        report(rel, `${name} reserved for shared/ui/base.css`, match.line, match.snippet);
      }
    });
  }

  if (rel === "app/globals.css") {
    const forbidden = [
      { label: '"html.theme-" not allowed in app/globals.css', regex: /html\.theme-/ },
      { label: '":root" not allowed in app/globals.css', regex: /^\s*:root\b/ },
      { label: '"body" selectors not allowed in app/globals.css', regex: /^\s*body\b/ },
      { label: '".button-" selectors not allowed in app/globals.css', regex: /(?<![\w-])\.button-/ },
      { label: '".ghost-link" not allowed in app/globals.css', regex: /\.ghost-link\b/ },
    ];
    forbidden.forEach(({ regex, label }) => {
      const match = findLine((line) => regex.test(line));
      if (match) {
        report(rel, label, match.line, match.snippet);
      }
    });
  }
};

const main = async () => {
  const cssFiles = await readFiles(ROOT);
  for (const file of cssFiles) {
    const content = await fs.readFile(file, "utf8");
    checkRules(file, content);
  }

  if (violations.length) {
    console.error("CSS guard detected violations:");
    violations.forEach(({ file, rule, line, snippet }) => {
      console.error(`- ${file}:${line} → ${rule}`);
      console.error(`    ${snippet}`);
    });
    process.exit(1);
  }

  console.log("CSS guard OK");
  process.exit(0);
};

main().catch((error) => {
  console.error("CSS guard failed", error);
  process.exit(1);
});
