import { readdir, readFile } from 'node:fs/promises';
import { dirname, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoots = [
  resolve(root, 'apps/frontend/src'),
  resolve(root, 'packages/shared-ui/src'),
];
const scannedExtensions = new Set(['.css', '.ts', '.tsx']);

// Tailwind v4 owns these framework custom properties. They are intentionally not
// redefined by PolyLex; additions require a documented reason in this allow-list.
const allowedExternalTokens = new Set([
  '--color-indigo-600',
  '--color-red-200',
  '--color-red-300',
  '--color-red-400',
]);
const allowedExternalPrefixes = ['--tw-'];

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) return collectFiles(path);
    return scannedExtensions.has(extname(entry.name)) ? [path] : [];
  }));
  return nested.flat();
}

function lineNumber(source, offset) {
  return source.slice(0, offset).split('\n').length;
}

function isAllowedExternal(token) {
  return allowedExternalTokens.has(token)
    || allowedExternalPrefixes.some((prefix) => token.startsWith(prefix));
}

const files = (await Promise.all(sourceRoots.map(collectFiles))).flat();
const definitions = new Map();
const usages = [];

for (const file of files) {
  const source = await readFile(file, 'utf8');
  const displayFile = relative(root, file);

  if (extname(file) === '.css') {
    let inDeprecatedAliases = false;
    let offset = 0;

    for (const line of source.split('\n')) {
      if (line.includes('deprecated aliases:start')) inDeprecatedAliases = true;

      const definitionPattern = /(--[A-Za-z0-9_-]+)\s*:/g;
      for (const match of line.matchAll(definitionPattern)) {
        const records = definitions.get(match[1]) ?? [];
        records.push({
          file: displayFile,
          line: lineNumber(source, offset + (match.index ?? 0)),
          deprecatedAlias: inDeprecatedAliases,
        });
        definitions.set(match[1], records);
      }

      if (line.includes('deprecated aliases:end')) inDeprecatedAliases = false;
      offset += line.length + 1;
    }
  }

  for (const match of source.matchAll(/var\(\s*(--[A-Za-z0-9_-]+)/g)) {
    usages.push({
      token: match[1],
      file: displayFile,
      line: lineNumber(source, match.index ?? 0),
    });
  }
}

const errors = [];

for (const [token, records] of definitions) {
  if (records.length > 1 && !records.slice(1).every((record) => record.deprecatedAlias)) {
    const locations = records.map(({ file, line }) => `${file}:${line}`).join(', ');
    errors.push(`duplicate ${token}: ${locations}`);
  }
}

for (const usage of usages) {
  if (!definitions.has(usage.token) && !isAllowedExternal(usage.token)) {
    errors.push(`undefined ${usage.token}: ${usage.file}:${usage.line}`);
  }
}

if (errors.length > 0) {
  console.error('Design token validation failed:');
  for (const error of [...new Set(errors)].sort()) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Design token validation passed (${definitions.size} definitions, ${usages.length} usages).`);
}
