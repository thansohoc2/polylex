import { copyFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const appRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const patchesDir = join(appRoot, 'patches');

function packageRoot(packageName) {
  return dirname(require.resolve(`${packageName}/package.json`));
}

function copyPatch(sourceName, destination, message) {
  copyFileSync(join(patchesDir, sourceName), destination);
  console.log(`✔ ${message}`);
}

try {
  const googleAuthRoot = packageRoot('@codetrix-studio/capacitor-google-auth');
  const googlePackage = join(googleAuthRoot, 'Package.swift');

  if (!existsSync(googlePackage)) {
    copyPatch(
      'capacitor-google-auth-Package.swift',
      googlePackage,
      'Patched capacitor-google-auth: added Package.swift',
    );
  }

  copyPatch(
    'capacitor-google-auth-Plugin.swift',
    join(googleAuthRoot, 'ios/Plugin/Plugin.swift'),
    'Patched capacitor-google-auth: updated Plugin.swift',
  );
} catch (error) {
  console.warn(`Skipping capacitor-google-auth patch: ${error.message}`);
}

try {
  const appleSignInRoot = packageRoot('@capacitor-community/apple-sign-in');
  copyPatch(
    'capacitor-apple-sign-in-Package.swift',
    join(appleSignInRoot, 'Package.swift'),
    'Patched apple-sign-in for Capacitor 8',
  );
} catch (error) {
  console.warn(`Skipping apple-sign-in patch: ${error.message}`);
}
