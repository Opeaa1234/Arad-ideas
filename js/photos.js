// Picks the best available real photo for a place, in this order:
//   1. a photo the user added on this device
//   2. the place's "photo" field in data/game-data.json:
//        "commons:File name.jpg"  a free-licensed photo on Wikimedia Commons; the author and
//                                 licence are read from Commons and shown as the credit
//        "assets/photos/x.jpg"    a local file, or any image URL (credit from "photoCredit")
//   3. the lead image of the Wikipedia article in the "wikipedia" field
// If none load, the caller shows a "no photo yet" panel.

import { WIKI_SUMMARY, WIKI_IMAGE_WIDTH } from './config.js';

const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const commonsCache = new Map();

// Only load HTTPS images or same-origin relative assets. User uploads are
// handled separately as data:image URLs and never pass through this helper.
export function safePhotoUrl(value) {
  if (typeof value !== 'string' || !value.trim() || /^\\s*\\/\\//.test(value)) return null;
  try {
    const base = typeof location !== 'undefined' && location.href
      ? location.href : 'https://arad-explorer.invalid/';
    const url = new URL(value, base);
    const origin = new URL(base).origin;
    if (url.username || url.password) return null;
    return url.protocol === 'https:' || url.origin === origin ? url.href : null;
  } catch { return null; }
}

// Attribution links must be HTTPS; unlike image paths, they are always external.
export function safeAttributionUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
const plain = html => { const d = document.createElement('div'); d.innerHTML = html || ''; return d.textContent.replace(/\s+/g, ' ').trim(); };

// Looks up a Commons file: a sized image URL plus author and licence for the credit.
async function commonsPhoto(fileName, credit) {
  if (commonsCache.has(fileName)) return commonsCache.get(fileName);
  const job = (async () => {
    const q = new URLSearchParams({
      action: 'query', format: 'json', origin: '*', prop: 'imageinfo',
      titles: 'File:' + fileName, iiprop: 'url|extmetadata', iiurlwidth: String(WIKI_IMAGE_WIDTH),
      iiextmetadatafilter: 'Artist|LicenseShortName',
    });
    try {
      const j = await (await fetch(COMMONS_API + '?' + q)).json();
      const page = Object.values((j.query && j.query.pages) || {})[0];
      const info = page && page.imageinfo && page.imageinfo[0];
      if (!info) return null;
      const meta = info.extmetadata || {};
      const author = plain(meta.Artist && meta.Artist.value);
      const licence = plain(meta.LicenseShortName && meta.LicenseShortName.value);
      const src = safePhotoUrl(info.thumburl || info.url);
      if (!src) return null;
      return {
        src,
        credit: credit || ['Foto: ' + (author || 'autor necunoscut'), licence, 'Wikimedia Commons'].filter(Boolean).join(' · '),
        link: safeAttributionUrl(info.descriptionurl),
      };
    } catch { return null; }
  })();
  commonsCache.set(fileName, job);
  return job;
}

const wikiCache = new Map();

// spec looks like "en:Arad_Administrative_Palace" (language optional, defaults to en).
async function wikiPhotos(spec) {
  if (wikiCache.has(spec)) return wikiCache.get(spec);
  const job = (async () => {
    const m = spec.match(/^([a-z]{2,3}):(.+)$/);
    const lang = m ? m[1] : 'en', title = (m ? m[2] : spec).replace(/ /g, '_');
    try {
      const res = await fetch(WIKI_SUMMARY(lang, title));
      if (!res.ok) return [];
      const j = await res.json();
      const page = safeAttributionUrl((j.content_urls && j.content_urls.desktop && j.content_urls.desktop.page) || `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title)}`);
      const credit = { credit: 'Fotografie provizorie de pe Wikipedia', link: page };
      const out = [];
      if (j.thumbnail && j.thumbnail.source) {
        const sized = safePhotoUrl(j.thumbnail.source.replace(/\/\d+px-/, `/${WIKI_IMAGE_WIDTH}px-`));
        const original = safePhotoUrl(j.thumbnail.source);
        if (sized) out.push({ src: sized, ...credit });
        if (original && original !== sized) out.push({ src: original, ...credit });
      }
      const original = j.originalimage && safePhotoUrl(j.originalimage.source);
      if (original && !out.some(item => item.src === original)) out.push({ src: original, ...credit });
      return out;
    } catch { return []; }
  })();
  wikiCache.set(spec, job);
  return job;
}

function loads(src) {
  src = safePhotoUrl(src);
  if (!src) return Promise.resolve(false);
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => resolve(img.naturalWidth > 1);
    img.onerror = () => resolve(false);
    img.src = src;
  });
}

// Resolves to { src, credit, link, own } or null.
export async function findPhoto(place, ownPhoto) {
  if (ownPhoto) return { src: ownPhoto, credit: 'Fotografia ta', own: true };
  const photo = typeof place.photo === 'string' ? place.photo : '';
  if (photo.startsWith('commons:')) {
    const c = await commonsPhoto(photo.slice(8).trim(), place.photoCredit);
    if (c && await loads(c.src)) return c;
  } else if (photo) {
    const src = safePhotoUrl(photo);
    const c = src && { src, credit: place.photoCredit || 'Fotografie' };
    if (c && await loads(c.src)) return c;
  }
  if (place.wikipedia) {
    for (const c of await wikiPhotos(place.wikipedia)) if (await loads(c.src)) return c;
  }
  return null;
}

export const searchPhotosUrl = place =>
  'https://www.google.com/search?tbm=isch&q=' + encodeURIComponent(place.name + ' Arad');

// Bound both the compressed upload and decoded dimensions: a small compressed
// image can still expand into a very large bitmap and exhaust browser memory.
const MAX_PHOTO_BYTES = 12 * 1024 * 1024;
const MAX_PHOTO_PIXELS = 40_000_000;
const MAX_PHOTO_SIDE = 12_000;

// Shrinks a picked image file to a JPEG data URL so it fits in browser storage.
export function fileToDataUrl(file, maxSide = 900) {
  return new Promise((resolve, reject) => {
    if (!file || typeof file.type !== 'string' || !file.type.startsWith('image/')) {
      reject(new Error('unsupported image type'));
      return;
    }
    if (!Number.isFinite(file.size) || file.size <= 0 || file.size > MAX_PHOTO_BYTES) {
      reject(new Error('image file is empty or too large'));
      return;
    }
    if (!Number.isFinite(maxSide) || maxSide <= 0) {
      reject(new Error('invalid output size'));
      return;
    }

    const fr = new FileReader();
    fr.onerror = () => reject(new Error('read failed'));
    fr.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('not an image'));
      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0
          || width > MAX_PHOTO_SIDE || height > MAX_PHOTO_SIDE
          || width * height > MAX_PHOTO_PIXELS) {
          reject(new Error('image dimensions are too large'));
          return;
        }
        try {
          const k = Math.min(1, maxSide / Math.max(width, height));
          const c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(width * k));
          c.height = Math.max(1, Math.round(height * k));
          const context = c.getContext('2d');
          if (!context) throw new Error('canvas unavailable');
          context.drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.82));
        } catch (err) {
          reject(err);
        }
      };
      img.src = fr.result;
    };
    fr.readAsDataURL(file);
  });
}
