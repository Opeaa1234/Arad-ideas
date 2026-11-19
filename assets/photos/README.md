# Arad Explorer catalogue photos

This folder contains local image assets referenced by `data/game-data.json`.

A file being present here does not establish copyright ownership or permission to publish it. Before a catalogue image is displayed in the player app, its place record must include a complete `photoAttribution` object with:

- `rightsBasis`: `owned`, `permission`, or `license`
- `author`: photographer or rights-holder name
- `license`: exact licence or permission basis
- `attribution`: the complete public credit line
- `sourceUrl`: HTTPS link to the original/source record
- `evidenceUrl`: HTTPS link to the licence or permission evidence

Do not invent missing details or use a generic `photoCredit` caption as a substitute. A populated record is not proof by itself: a reviewer must inspect the linked source and evidence. Until verified and recorded, the app will not display the image.

**Unverified local catalogue files have been removed from this development branch** so they cannot be included in a future build from this branch by accident. Their references remain in the catalogue but the app withholds them. The removal does not erase older Git history, previous deployments, caches, forks, or copies. If a previous public deployment exposed an image, it may remain retrievable from that deployment or a cache; review the hosting history and purge public copies where appropriate before release.

Restore an image only after its rights basis and evidence have been reviewed and recorded in its catalogue entry. Player-uploaded photos are separate, device-local contributions and are not approved catalogue assets.
