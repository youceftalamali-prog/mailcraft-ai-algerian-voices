import { readFile } from 'node:fs/promises';

const expressEntry = new URL('../node_modules/express/lib/express.js', import.meta.url);
let source;

try {
  source = await readFile(expressEntry, 'utf8');
} catch (error) {
  if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
    console.warn('[postinstall] Express not installed; skipping Worker compatibility patch.');
    process.exit(0);
  }
  throw error;
}

const bodyParserImport = "var bodyParser = require('body-parser')";
const exportsToRemove = [
  'exports.json = bodyParser.json',
  'exports.raw = bodyParser.raw',
  'exports.text = bodyParser.text',
  'exports.urlencoded = bodyParser.urlencoded',
];

if (!source.includes(bodyParserImport)) {
  if (!source.includes("require('body-parser')") && exportsToRemove.every((line) => !source.includes(line))) {
    console.log('[postinstall] Express Worker compatibility patch already applied.');
    process.exit(0);
  }
  throw new Error('[postinstall] Express entry has an unexpected body-parser layout; refusing an unsafe patch.');
}

for (const line of exportsToRemove) {
  if (!source.includes(line)) {
    throw new Error(`[postinstall] Expected Express export was not found: ${line}`);
  }
}

source = source.replace(bodyParserImport, '// body-parser import removed for Cloudflare Workers compatibility');
for (const line of exportsToRemove) {
  source = source.replace(line, '// ' + line + ' removed for Cloudflare Workers compatibility');
}

await (await import('node:fs/promises')).writeFile(expressEntry, source, 'utf8');
console.log('[postinstall] Removed Express body-parser eager imports for Cloudflare Workers.');
