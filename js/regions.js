// Explicit regional configuration for the shared Explorer engine.
// Region selection is a user choice; GPS is never used to select or switch regions.

const REGIONS = {
  "ro-arad": Object.freeze({
    id: "ro-arad",
    name: "Arad Explorer",
    countryCode: "RO",
    countryName: "Romania",
    adminArea: "Arad",
    locale: "ro-RO",
    cataloguePath: "data/game-data.json",
    mapCenter: Object.freeze([46.1765, 21.3216]),
    defaultRadiusMeters: 72,
    arrivalThresholdMeters: 25,
    storagePrefix: "arad-explorer:v3:",
    enabled: true
  }),
  "ng-lagos": Object.freeze({
    id: "ng-lagos",
    name: "Lagos Explorer",
    countryCode: "NG",
    countryName: "Nigeria",
    adminArea: "Lagos State",
    locale: "en-NG",
    cataloguePath: "data/regions/ng-lagos/game-data.json",
    mapCenter: Object.freeze([6.5244, 3.3792]),
    defaultRadiusMeters: 72,
    arrivalThresholdMeters: 25,
    storagePrefix: "explorer:ng-lagos:v1:user:",
    enabled: false
  })
};

export const DEFAULT_REGION_ID = "ro-arad";
export const REGION_IDS = Object.freeze(Object.keys(REGIONS));

export function getRegion(regionId) {
  return typeof regionId === "string" && Object.hasOwn(REGIONS, regionId)
    ? REGIONS[regionId]
    : null;
}

// An omitted choice preserves the current Arad experience. Unknown or disabled
// regions fail closed rather than silently switching a player's data.
export function resolveRegion(explicitRegionId) {
  const id = explicitRegionId == null || explicitRegionId === ""
    ? DEFAULT_REGION_ID
    : explicitRegionId;
  const region = getRegion(id);
  return region?.enabled ? region : null;
}

export function getRegionStoragePrefix(regionId, userId) {
  const region = resolveRegion(regionId);
  if (!region || typeof userId !== "string" || !userId.trim()) return null;
  return region.id === "ro-arad"
    ? region.storagePrefix + userId + ":"
    : region.storagePrefix + userId + ":";
}
