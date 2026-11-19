import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_REGION_ID,
  REGION_IDS,
  getRegion,
  resolveRegion,
  getRegionStoragePrefix
} from "../js/regions.js";

test("regional catalogue defines stable Arad and Lagos identities", () => {
  assert.deepEqual(REGION_IDS, ["ro-arad", "ng-lagos"]);
  assert.equal(getRegion("ro-arad").countryCode, "RO");
  assert.equal(getRegion("ng-lagos").countryCode, "NG");
  assert.equal(getRegion("ng-lagos").locale, "en-NG");
});

test("existing visitors remain on Arad unless they explicitly choose another region", () => {
  assert.equal(DEFAULT_REGION_ID, "ro-arad");
  assert.equal(resolveRegion().id, "ro-arad");
  assert.equal(resolveRegion("ro-arad").cataloguePath, "data/game-data.json");
});

test("unknown and not-yet-enabled regions fail closed", () => {
  assert.equal(resolveRegion("ng-lagos"), null);
  assert.equal(resolveRegion("not-a-region"), null);
  assert.equal(getRegion("not-a-region"), null);
});

test("region storage namespaces preserve Arad and isolate future Lagos accounts", () => {
  assert.equal(getRegionStoragePrefix("ro-arad", "user-1"), "arad-explorer:v3:user-1:");
  assert.equal(getRegionStoragePrefix("ng-lagos", "user-1"), null);
  assert.equal(getRegionStoragePrefix("ro-arad", ""), null);
});

test("GPS coordinates are not part of region selection", () => {
  assert.equal(resolveRegion({ lat: 6.5244, lon: 3.3792 }), null);
  assert.equal(resolveRegion("ro-arad").id, "ro-arad");
});
