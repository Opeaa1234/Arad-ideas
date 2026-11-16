import test from 'node:test';
import assert from 'node:assert/strict';
import { fileToDataUrl, safePhotoUrl, safeAttributionUrl } from '../js/photos.js';

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
