const fs = require('fs');
const path = require('path');
const assert = require('assert');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const app = read('app.js');
const index = read('index.html');
const serviceWorker = read('service-worker.js');

function test(name, fn) {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (err) {
    console.error(`not ok - ${name}`);
    console.error(err.message);
    process.exitCode = 1;
  }
}

test('app version matches service worker cache version', () => {
  const appVersion = app.match(/APP_VERSION\s*=\s*'([^']+)'/)?.[1];
  const cacheVersion = serviceWorker.match(/CACHE_NAME\s*=\s*"treningsapp-([^"]+)"/)?.[1];
  assert.ok(appVersion, 'APP_VERSION was not found in app.js');
  assert.ok(cacheVersion, 'CACHE_NAME was not found in service-worker.js');
  assert.strictEqual(appVersion, cacheVersion);
});

test('all user data collections are included in replacement import', () => {
  const collections = app.match(/DATA_COLLECTIONS\s*=\s*\[([^\]]+)\]/)?.[1] || '';
  ['templates', 'planned', 'completed', 'wellness', 'challenges', 'blockedDays'].forEach(collection => {
    assert.ok(collections.includes(`'${collection}'`), `${collection} is missing from DATA_COLLECTIONS`);
  });
  assert.ok(app.includes('replaceFirestoreData(nextState)'), 'import does not call replaceFirestoreData(nextState)');
  assert.ok(app.includes('deleteOps'), 'replaceFirestoreData should delete existing docs before importing');
});

test('safe write wrapper is present and used by high-risk flows', () => {
  assert.ok(app.includes('async function safeStateWrite'), 'safeStateWrite is missing');
  const usageCount = (app.match(/safeStateWrite\(/g) || []).length;
  assert.ok(usageCount >= 10, `expected safeStateWrite to be used broadly, found ${usageCount}`);
});

test('local recovery snapshot can be saved and restored from UI', () => {
  assert.ok(app.includes('saveRecoverySnapshot'), 'saveRecoverySnapshot is missing');
  assert.ok(app.includes('restoreRecoverySnapshot'), 'restoreRecoverySnapshot is missing');
  assert.ok(index.includes('restoreRecoverySnapshot()'), 'recovery restore button is missing from index.html');
});

test('service worker caches required app shell files', () => {
  ['./index.html', './styles.css', './app.js', './manifest.json'].forEach(file => {
    assert.ok(serviceWorker.includes(file), `${file} is missing from service worker app shell`);
  });
});

if (process.exitCode) process.exit(process.exitCode);
