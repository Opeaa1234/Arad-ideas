import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../css/styles.css', import.meta.url), 'utf8');

function hasId(id) {
  return html.includes('id=\"' + id + '\"') || html.includes("id='" + id + "'");
}

test('document declares Romanian language and mobile viewport', () => {
  assert.match(html, /<html lang="ro">/);
  assert.match(html, /name="viewport"[^>]*width=device-width/);
});

test('all application screens referenced by the controller exist', () => {
  for (const screen of ['loading', 'welcome', 'dashboard', 'leaderboard', 'routeSelect', 'app', 'minigame', 'fatal']) {
    assert.ok(hasId(screen), 'missing screen #' + screen);
  }
});

test('authentication form has labelled email, password and display-name inputs', () => {
  for (const id of ['authForm', 'authEmail', 'authPass', 'authName', 'authSubmit', 'authErr', 'authOk']) {
    assert.ok(hasId(id), 'missing authentication element #' + id);
  }
  assert.match(html, /class="field"[^>]*id="fEmail"/);
  assert.match(html, /class="field"[^>]*id="fPass"/);
});

test('authentication feedback uses accessible status and alert roles', () => {
  assert.match(html, /id="authErr"[^>]*role="alert"/);
  assert.match(html, /id="authOk"[^>]*role="status"/);
});

test('theme control has an accessible name and stable selector', () => {
  assert.match(html, /id="themeBtn"[^>]*aria-label=/);
  assert.match(app, /data-act="theme"|case 'theme'/);
});

test('account menu exposes menu semantics and an expanded-state control', () => {
  assert.match(html, /id="accountBtn"[^>]*aria-haspopup="true"/);
  assert.match(html, /id="accountBtn"[^>]*aria-expanded="false"/);
  assert.match(html, /id="accountMenu"[^>]*role="menu"/);
});

test('primary navigation and gameplay controls have stable IDs', () => {
  for (const id of ['leaderboardBtn', 'dashMapGo', 'map', 'placeList', 'toast']) {
    assert.ok(hasId(id), 'missing gameplay/navigation element #' + id);
  }
});

test('mobile layout includes responsive CSS rules', () => {
  assert.match(css, /@media[^\\{]*max-width/);
  assert.match(css, /100dvh|100vh/);
});

test('controller handles the expected critical user journeys', () => {
  for (const marker of ['submitAuth', 'signOut', 'startGPS', 'fetchRoute', 'recordPlaceResult', 'flushPendingResults']) {
    assert.ok(app.includes(marker), 'missing controller integration marker: ' + marker);
  }
});
