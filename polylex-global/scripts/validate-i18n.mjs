import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const localeDir = path.join(rootDir, 'apps/frontend/src/i18n/locales');
const localeNames = ['en', 'vi', 'pt'];

function flatten(value, prefix = '', output = new Map()) {
  if (typeof value === 'string') {
    output.set(prefix, value);
    return output;
  }

  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new TypeError(`Translation key "${prefix || '<root>'}" must contain an object or string.`);
  }

  for (const [key, child] of Object.entries(value)) {
    flatten(child, prefix ? `${prefix}.${key}` : key, output);
  }
  return output;
}

function placeholders(message) {
  return [...message.matchAll(/{{\s*([\w.-]+)\s*}}/g)]
    .map((match) => match[1])
    .sort();
}

const locales = new Map();
for (const localeName of localeNames) {
  const filePath = path.join(localeDir, `${localeName}.json`);
  const parsed = JSON.parse(await readFile(filePath, 'utf8'));
  locales.set(localeName, flatten(parsed));
}

const reference = locales.get('en');
let failed = false;

for (const localeName of localeNames.slice(1)) {
  const candidate = locales.get(localeName);
  const missing = [...reference.keys()].filter((key) => !candidate.has(key));
  const extra = [...candidate.keys()].filter((key) => !reference.has(key));
  const placeholderMismatches = [...reference.keys()].flatMap((key) => {
    if (!candidate.has(key)) return [];
    const expected = placeholders(reference.get(key));
    const actual = placeholders(candidate.get(key));
    return expected.join('\0') === actual.join('\0')
      ? []
      : [{ key, expected, actual }];
  });

  if (missing.length || extra.length || placeholderMismatches.length) {
    failed = true;
    console.error(`\nLocale ${localeName} differs from en:`);
    if (missing.length) console.error(`  Missing keys:\n${missing.map((key) => `    - ${key}`).join('\n')}`);
    if (extra.length) console.error(`  Extra keys:\n${extra.map((key) => `    + ${key}`).join('\n')}`);
    if (placeholderMismatches.length) {
      console.error('  Placeholder mismatches:');
      for (const mismatch of placeholderMismatches) {
        console.error(`    * ${mismatch.key}: expected [${mismatch.expected.join(', ')}], received [${mismatch.actual.join(', ')}]`);
      }
    }
  }
}

if (failed) process.exit(1);
console.log(`i18n validation passed (${reference.size} keys across ${localeNames.join(', ')}).`);
