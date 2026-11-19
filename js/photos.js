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

export function safePhotoUrl(value) {
  if (typeof value !== 'string' || !value.trim() || value.trim().startsWith('//')) return null;
  try {
    const base = typeof location !== 'undefined' && location.href
      ? location.href : 'https://arad-explorer.invalid/';
    const url = new URL(value, base);
    const origin = new URL(base).origin;
    if (url.username || url.password) return null;
    return url.protocol === 'https:' || url.origin === origin ? url.href : null;
  } catch { return null; }
}

export function safeAttributionUrl(value) {
  if (typeof value !== 'string' || !value.trim()) return null;
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

const plain = html => {
  const d = document.createElement('div');
  d.innerHTML = html || '';
  return d.textContent.replace(/\\s+/g, ' ').trim();
};

// Catalogue-managed photos must carry a traceable rights record. A display
// caption alone is not evidence of ownership, permission, or an open licence.
export function isReleaseReadyPhotoAttribution(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const text = key => typeof value[key] === 'string' && value[key].trim().length > 0;
  const basis = ['owned', 'permission', 'license'].includes(value.rightsBasis);
  return basis && text('author') && text('license') && text('attribution')
    && !!safeAttributionUrl(value.sourceUrl)
    && !!safeAttributionUrl(value.evidenceUrl);
}

async function commonsPhoto(fileName) {
  if (commonsCache.has(fileName)) return commonsCache.get(fileName);
  const job = (async () => {
    const q = new URLSearchParams({
      action: 'query', format: 'json', origin: '*', prop: 'imageinfo',
      titles: 'File:' + fileName, iiprop: 'url|extmetadata', iiurlwidth: String(WIKI_IMAGE_WIDTH),
      iiextmetadatafilter: 'Artist|LicenseShortName|LicenseUrl',
    });
    try {
      const response = await fetch(COMMONS_API + '?' + q);
      if (!response.ok) return null;
      const j = await response.json();
      const page = Object.values((j.query && j.query.pages) || {})[0];
      const info = page && page.imageinfo && page.imageinfo[0];
      if (!info) return null;
      const meta = info.extmetadata || {};
      const author = plain(meta.Artist && meta.Artist.value);
      const licence = plain(meta.LicenseShortName && meta.LicenseShortName.value);
      const licenceUrl = safeAttributionUrl(meta.LicenseUrl && meta.LicenseUrl.value);
      const sourceUrl = safeAttributionUrl(info.descriptionurl);
      const src = safePhotoUrl(info.thumburl || info.url);
      // Missing any core attribution field means we do not display this image.
      if (!author || !licence || !licenceUrl || !sourceUrl || !src) return null;
      return {
        src,
        credit: 'Foto: ' + author + ' · ' + licence + ' · Wikimedia Commons',
        link: sourceUrl,
        licenseLink: licenceUrl,
        author,
        license: licence,
      };
    } catch { return null; }
  })();
  commonsCache.set(fileName, job);
  return job;
}

// Resolves to { src, credit, link, own } or null.
// Wikipedia lead images are deliberately not used: the summary API's generic
// page attribution does not establish the individual image's author/licence.
export async function findPhoto(place, ownPhoto) {
  if (ownPhoto) return { src: ownPhoto, credit: 'Fotografia ta', own: true };
  const photo = typeof place.photo === 'string' ? place.photo : '';
  if (photo.startsWith('commons:')) {
    const c = await commonsPhoto(photo.slice(8).trim());
    if (c && await loads(c.src)) return c;
    return null;
  }
  if (photo && isReleaseReadyPhotoAttribution(place.photoAttribution)) {
    const src = safePhotoUrl(photo);
    const attribution = place.photoAttribution;
    const c = src && {
      src,
      credit: attribution.attribution,
      link: safeAttributionUrl(attribution.sourceUrl),
      licenseLink: safeAttributionUrl(attribution.evidenceUrl),
    };
    if (c && await loads(c.src)) return c;
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
