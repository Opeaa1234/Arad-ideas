import test from 'node:test';
import assert from 'node:assert/strict';
import { fileToDataUrl, findPhoto, safePhotoUrl, safeAttributionUrl, isReleaseReadyPhotoAttribution } from '../js/photos.js';
import { readFile } from 'node:fs/promises';

function installImageMocks(t, { width = 1600, height = 1200, context = true } = {}) {
  const saved = {
    FileReader: globalThis.FileReader,
    Image: globalThis.Image,
    document: globalThis.document
  };
  globalThis.FileReader = class {
    readAsDataURL() { this.result = 'data:image/png;base64,AA=='; this.onload(); }
  };
  globalThis.Image = class {
    set src(value) {
      this.naturalWidth = width;
      this.naturalHeight = height;
      this.onload();
    }
  };
  globalThis.document = {
    createElement(name) {
      assert.equal(name, 'canvas');
      return {
        width: 0, height: 0,
        getContext() {
          return context ? { drawImage() {} } : null;
        },
        toDataURL() { return 'data:image/jpeg;base64,compressed'; }
      };
    }
  };
  t.after(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  });
}

const imageFile = (overrides = {}) => ({
  type: 'image/png',
  size: 1024,
  ...overrides
});

test('compresses a valid image into a JPEG data URL', async t => {
  installImageMocks(t);
  assert.equal(await fileToDataUrl(imageFile()), 'data:image/jpeg;base64,compressed');
});

test('rejects non-image files before reading them', async t => {
  installImageMocks(t);
  await assert.rejects(fileToDataUrl(imageFile({ type: 'text/plain' })), /unsupported image type/);
});

test('rejects empty and oversized image files before decoding', async t => {
  installImageMocks(t);
  await assert.rejects(fileToDataUrl(imageFile({ size: 0 })), /empty or too large/);
  await assert.rejects(fileToDataUrl(imageFile({ size: 12 * 1024 * 1024 + 1 })), /empty or too large/);
});

test('rejects images with excessive decoded dimensions', async t => {
  installImageMocks(t, { width: 10000, height: 5000 });
  await assert.rejects(fileToDataUrl(imageFile()), /dimensions are too large/);
});

test('handles unavailable canvas contexts without throwing synchronously', async t => {
  installImageMocks(t, { context: false });
  await assert.rejects(fileToDataUrl(imageFile()), /canvas unavailable/);
});

test('accepts HTTPS and same-origin photo URLs but rejects executable or insecure external URLs', () => {
  assert.equal(safePhotoUrl('https://images.example/photo.jpg'), 'https://images.example/photo.jpg');
  assert.equal(safePhotoUrl('assets/photos/arad.jpg'), 'https://arad-explorer.invalid/assets/photos/arad.jpg');
  assert.equal(safePhotoUrl('javascript:alert(1)'), null);
  assert.equal(safePhotoUrl('data:text/html,<script>alert(1)</script>'), null);
  assert.equal(safePhotoUrl('http://images.example/photo.jpg'), null);
  assert.equal(safePhotoUrl('//images.example/photo.jpg'), null);
  assert.equal(safePhotoUrl(''), null);
});

test('attribution links must be HTTPS and cannot contain credentials', () => {
  assert.equal(safeAttributionUrl('https://commons.wikimedia.org/wiki/File:Arad.jpg'), 'https://commons.wikimedia.org/wiki/File:Arad.jpg');
  assert.equal(safeAttributionUrl('javascript:alert(1)'), null);
  assert.equal(safeAttributionUrl('http://example.com/photo'), null);
  assert.equal(safeAttributionUrl('https://user:pass@example.com/'), null);
});

test('findPhoto safely handles missing optional photo metadata', async () => {
  assert.equal(await findPhoto({}, null), null);
  assert.equal(await findPhoto({ photo: '' }, null), null);
});

test('catalogue photo attribution requires author, licence, source and evidence', () => {
  const valid = {
    rightsBasis: 'permission',
    author: 'Photographer',
    license: 'Permission granted',
    attribution: 'Photo by Photographer, used with permission',
    sourceUrl: 'https://example.org/original-photo',
    evidenceUrl: 'https://example.org/permission-record'
  };
  assert.equal(isReleaseReadyPhotoAttribution(valid), true);
  assert.equal(isReleaseReadyPhotoAttribution({ ...valid, author: '' }), false);
  assert.equal(isReleaseReadyPhotoAttribution({ ...valid, license: '' }), false);
  assert.equal(isReleaseReadyPhotoAttribution({ ...valid, sourceUrl: 'http://example.org/photo' }), false);
  assert.equal(isReleaseReadyPhotoAttribution({ ...valid, evidenceUrl: '' }), false);
  assert.equal(isReleaseReadyPhotoAttribution({ ...valid, rightsBasis: 'unknown' }), false);
});

test('unverified local and Wikipedia fallback photos are not displayed', async () => {
  assert.equal(await findPhoto({
    photo: 'assets/photos/strand-neptun.jpg',
    photoCredit: 'Photo by someone'
  }, null), null);
  assert.equal(await findPhoto({
    wikipedia: 'en:Arad'
  }, null), null);
});


test('Commons images require and preserve author and exact licence links', async t => {
  const saved = { fetch: globalThis.fetch, Image: globalThis.Image, document: globalThis.document };
  t.after(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  });
  globalThis.document = {
    createElement(name) {
      assert.equal(name, 'div');
      return {
        textContent: '',
        set innerHTML(value) { this.textContent = String(value).replace(/<[^>]*>/g, ''); }
      };
    }
  };
  globalThis.Image = class {
    set src(value) { this.naturalWidth = 800; this.onload(); }
  };
  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      return { query: { pages: { 1: { imageinfo: [{
        thumburl: 'https://upload.wikimedia.org/example.jpg',
        descriptionurl: 'https://commons.wikimedia.org/wiki/File:Verified_test_image.jpg',
        extmetadata: {
          Artist: { value: 'Photographer One' },
          LicenseShortName: { value: 'CC BY-SA 4.0' },
          LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0/' }
        }
      }] } } } };
    }
  });
  const photo = await findPhoto({ photo: 'commons:Verified test image.jpg' }, null);
  assert.equal(photo.credit, 'Foto: Photographer One · CC BY-SA 4.0 · Wikimedia Commons');
  assert.equal(photo.link, 'https://commons.wikimedia.org/wiki/File:Verified_test_image.jpg');
  assert.equal(photo.licenseLink, 'https://creativecommons.org/licenses/by-sa/4.0/');
});

test('Commons images with incomplete rights metadata are withheld', async t => {
  const saved = { fetch: globalThis.fetch, document: globalThis.document };
  t.after(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  });
  globalThis.document = {
    createElement() {
      return {
        textContent: '',
        set innerHTML(value) { this.textContent = String(value).replace(/<[^>]*>/g, ''); }
      };
    }
  };
  globalThis.fetch = async () => ({
    ok: true,
    async json() {
      return { query: { pages: { 1: { imageinfo: [{
        thumburl: 'https://upload.wikimedia.org/example-missing.jpg',
        descriptionurl: 'https://commons.wikimedia.org/wiki/File:Missing_author.jpg',
        extmetadata: {
          LicenseShortName: { value: 'CC BY-SA 4.0' },
          LicenseUrl: { value: 'https://creativecommons.org/licenses/by-sa/4.0/' }
        }
      }] } } } };
    }
  });
  assert.equal(await findPhoto({ photo: 'commons:Missing author test.jpg' }, null), null);
});

test('every local catalogue photo without verified rights metadata stays hidden', async () => {
  const data = JSON.parse(await readFile(new URL('../data/game-data.json', import.meta.url), 'utf8'));
  const unverified = data.places.filter(place =>
    typeof place.photo === 'string' && place.photo && !place.photo.startsWith('commons:')
    && !isReleaseReadyPhotoAttribution(place.photoAttribution)
  );
  assert.ok(unverified.length > 0);
  for (const place of unverified) assert.equal(await findPhoto(place, null), null, place.id);
  const policy = await readFile(new URL('../assets/photos/README.md', import.meta.url), 'utf8');
  assert.match(policy, /does not erase older Git history/i);
  assert.match(policy, /will not display the image/i);
});
