import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

// index.html loads only the Material Symbols named in icon_names. An icon missing from that list
// renders as its plain name ("menu", "person") instead of the glyph, so every name the app can
// render must be listed.
const root = new URL('../', import.meta.url);
const html = readFileSync(new URL('index.html', root), 'utf8');
const iconLink = html.match(/family=Material\+Symbols\+Outlined:[^"]*icon_names=([a-z0-9_,]+)/);
assert.ok(iconLink, 'index.html must load Material Symbols with icon_names');
const listed = iconLink[1].split(',');

const sourceFiles = dir => readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const path = join(dir, entry.name);
  if (entry.isDirectory()) return sourceFiles(path);
  return /\.(ts|tsx)$/.test(entry.name) ? [path] : [];
});

function usedIcons() {
  const used = new Map();
  const add = (name, where) => used.set(name, used.get(name) ?? where);
  for (const file of sourceFiles(new URL('src', root).pathname)) {
    const source = readFileSync(file, 'utf8');
    for (const span of source.matchAll(/material-symbols-outlined[^>]*>([\s\S]*?)<\/span>/g)) {
      const content = span[1].trim();
      if (/^[a-z0-9_]+$/.test(content)) {
        add(content, file);
        continue;
      }
      const literals = [...content.matchAll(/['"]([a-z0-9_]+)['"]/g)].map(match => match[1]);
      literals.forEach(name => add(name, file));
      if (literals.length > 0) continue;
      // A computed name ({iconMap[type]}, {getCategoryIcon(name)}) reads a lookup table declared
      // in the same file as `const <name> = ... { key: 'icon_name', ... };`.
      const lookup = content.match(/^\{\s*([A-Za-z_$][\w$]*)/)?.[1];
      const start = lookup ? source.indexOf(`const ${lookup}`) : -1;
      const end = start < 0 ? -1 : source.indexOf('};', start);
      assert.ok(end > start, `${file}: computed icon name without a lookup table: ${content}`);
      const table = [...source.slice(start, end).matchAll(/:\s*['"]([a-z][a-z0-9_]*)['"]/g)].map(match => match[1]);
      assert.ok(table.length > 0, `${file}: lookup table ${lookup} has no icon names`);
      table.forEach(name => add(name, file));
    }
  }
  return used;
}

test('icon_names는 알파벳순이고 중복이 없다', () => {
  assert.deepEqual(listed, [...new Set(listed)].sort());
});

test('앱이 그리는 모든 아이콘이 icon_names에 있다', () => {
  const missing = [...usedIcons()].filter(([name]) => !listed.includes(name));
  assert.deepEqual(missing.map(([name, file]) => `${name} (${file})`), []);
});

test('icon_names에는 앱이 쓰지 않는 이름이 없다', () => {
  const used = usedIcons();
  assert.deepEqual(listed.filter(name => !used.has(name)), []);
});
