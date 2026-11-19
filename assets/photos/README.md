# Arad Explorer catalogue photos

This folder contains local image assets referenced by `data/game-data.json`.

A file being present here does not establish copyright ownership or permission to publish it. Before a catalogue image is displayed in the player app, its place record must include a complete `photoAttribution` object with:

- `rightsBasis`: `owned`, `permission`, or `license`
- `author`: photographer or rights-holder name
- `license`: exact licence or permission basis
- `attribution`: the complete public credit line
- `sourceUrl`: HTTPS link to the original/source record
- `evidenceUrl`: HTTPS link to the licence or permission evidence

Do not invent missing details or use a generic `photoCredit` caption as a substitute. A populated record is not proof by itself: a reviewer must inspect the linked source and evidence. Until verified and recorded, the app will not display the image. This display gate does not make the underlying file private: if this repository or static deployment is public, the image file may still be fetched directly. Treat every unverified image as a release blocker and remove it from the published bundle or restrict public access before launch. Do not delete or overwrite existing assets as part of this audit; preserve them pending an explicit rights decision.

Player-uploaded photos are separate, device-local contributions and are not approved catalogue assets.