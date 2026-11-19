import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

async function collectJavaScript(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectJavaScript(path));
    else if (entry.isFile() && entry.name.endsWith('.js')) files.push(path);
  }
  return files;
}

test('every repository JavaScript file parses successfully', async () => {
  const files = await collectJavaScript(root);
  assert.ok(files.length > 0);
  for (const file of files) {
    assert.doesNotThrow(() => execFileSync(process.execPath, ['--check', file], {
      cwd: root, stdio: 'pipe'
    }), file.slice(root.length + 1));
  }
});
