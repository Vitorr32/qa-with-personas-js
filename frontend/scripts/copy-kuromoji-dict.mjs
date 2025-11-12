import { promises as fs } from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function main() {
  try {
    const projectRoot = path.resolve(__dirname, '..');
    const nodeModules = path.join(projectRoot, 'node_modules');
    const srcDict = path.join(nodeModules, 'kuromoji', 'dict');
    const publicDir = path.join(projectRoot, 'public');
    const destDict = path.join(publicDir, 'kuromoji', 'dict');

    // Ensure source dict exists (skip if not installed yet)
    try {
      await fs.access(srcDict);
    } catch {
      console.warn('[copy-kuromoji-dict] kuromoji dict not found at', srcDict);
      return;
    }

    await copyDir(srcDict, destDict);
    console.log('[copy-kuromoji-dict] Copied kuromoji dict to', destDict);
  } catch (err) {
    console.warn('[copy-kuromoji-dict] Failed to copy kuromoji dict:', err?.message || err);
  }
}

main();
