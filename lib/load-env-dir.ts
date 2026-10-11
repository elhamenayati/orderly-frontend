import fs from "node:fs";
import path from "node:path";

function parseEnvFile(contents: string): Record<string, string> {
  const values: Record<string, string> = {};

  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator <= 0) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }

  return values;
}

/** Load `.env/local`, then fall back to `.env/example`. Process env wins. */
export function loadEnvDir(cwd = process.cwd()) {
  const localPath = path.join(cwd, ".env", "local");
  const examplePath = path.join(cwd, ".env", "example");
  const filePath = fs.existsSync(localPath) ? localPath : examplePath;

  if (!fs.existsSync(filePath)) {
    return;
  }

  const parsed = parseEnvFile(fs.readFileSync(filePath, "utf8"));
  for (const [key, value] of Object.entries(parsed)) {
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}
