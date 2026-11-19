# Lagos Explorer — catalogue research register

**Status: desk research only — not approved for in-app publication.**  
Prepared 19 November 2026. No field visit, access agreement, safety inspection, GPS survey, photo-rights clearance or backend validation is implied by this document.

This register separates a credible place lead from a release-ready game stop. A venue appearing here does not mean it is open today, accepts walk-ins, permits photography, or is safe to approach on foot.

## Initial Onikan / Lagos Island cluster

| Candidate ID | Place | Area | Research basis | Outstanding checks |
| --- | --- | --- | --- | --- |
| `lagos-national-museum` | National Museum Lagos | Onikan | Listed by the National Commission for Museums and Monuments at King George V Road, Onikan. | Confirm current gallery access, hours, admission, renovation status, photography rules and exact visitor entrance with NCMM. |
| `lagos-john-randle-centre` | J. Randle Centre for Yorùbá Culture and History | Onikan Roundabout | Official visitor page gives the Onikan Roundabout location and publishes visitor hours/admission. | Reconfirm hours and fees directly before launch; obtain permission for any in-gallery game activity or photography. |
| `lagos-freedom-park` | Freedom Park | 1 Hospital Road, Lagos Island | Official site describes the former Broad Street Prison site as a memorial and arts/recreation centre. | Confirm public access, event closures, admission, filming/photography terms and safe pedestrian approach. |
| `lagos-tafawa-balewa-square` | Tafawa Balewa Square | Onikan / Lagos Island | Established public landmark in the same cultural district. | Do not assume unrestricted entry: verify current management, event/security restrictions and permission before using it as a GPS-triggered stop. |

## Additional candidates for later review

| Candidate ID | Place | Area | Research lead | Outstanding checks |
| --- | --- | --- | --- | --- |
| `lekki-conservation-centre` | Lekki Conservation Centre | Lekki | Nigerian Conservation Foundation identifies its visitor site at Km 19, Lekki–Epe Expressway. | Confirm visitor access, ticketing, opening times, current walkway condition, safety briefing and photography permissions. |
| `lekki-nike-art-gallery` | Nike Art Gallery | Lekki | Publicly listed gallery; a reliable operator-issued visitor/access page should be captured before publication. | Confirm current address, admission, hours, photography and group/game permissions directly with the gallery. |
| `ikeja-kalakuta-museum` | Kalakuta Museum | Ikeja | Candidate heritage site associated with Fela Anikulapo-Kuti. | Confirm current operator, exact entrance, opening/access arrangements, tour rules and photography terms. |
| `badagry-heritage-museum` | Badagry Heritage Museum | Badagry | Candidate heritage institution in the Badagry history cluster. | Confirm official institutional name, custodian, exact coordinates, access and relationship to other Badagry heritage sites before creating separate stops. |

## Source register

Prefer the venue or responsible public institution as the primary source. Third-party guides can help discover candidates but must not be treated as proof of access or current conditions.

- National Commission for Museums and Monuments — [National Museums list](https://museum.ng/national-museums-list/) (lists National Museum Lagos at King George V Road, Onikan).
- J. Randle Centre — [official visitor information](https://www.jrandlecentre.com/) (location, published hours and admission; all must be rechecked before a visit).
- Freedom Park Lagos — [official About page](https://freedomparklagos.com/about.php) (site history, address and published hours).
- Nigerian Conservation Foundation — [official website](https://ncfnigeria.org/) and [Lekki Conservation Centre brochure](https://ncfnigeria.org/wp-content/uploads/2024/01/Green-Ball-Brochure-FV.pdf) (operator and visitor-site contact details).
- Independent discovery references: [MyNigeriaGuide Lagos research](https://mynigeriaguide.com/explore/lagos) and [Guardian Lagos attractions guide](https://guardian.ng/life/your-next-adventure-spot/). Use only as leads; verify all claims with the venue.

## Publication checklist for every stop

A candidate can move into the playable catalogue only when all of these have an evidence record:

1. **Identity:** confirmed official name, responsible custodian and public visitor entrance.
2. **Location:** two independent coordinate checks, then an on-site or trusted local verification; store coordinate uncertainty and avoid placing a discovery radius across a road or restricted boundary.
3. **Access:** written or otherwise documented confirmation of public access, current hours, admission, event closures and any group/activity permission.
4. **Pedestrian safety:** a verified pedestrian approach and safe waiting point. Never substitute driving directions or a straight line for a walking route. Do not instruct visitors to cross expressways or enter private/security-controlled property.
5. **Content:** fact-checked, original explanatory text and questions; retain source URLs and review dates for each factual claim.
6. **Images:** owned, permission-cleared or correctly licensed assets with complete attribution evidence. A venue's public website image is not automatically reusable.
7. **Privacy:** GPS discovery must remain opt-in and region selection must remain an explicit player choice; never switch region from GPS.
8. **Operations:** a named local reviewer, correction/reporting route and a process to temporarily disable a stop when access or safety changes.

## Current release decision

Lagos remains **disabled** in `js/regions.js`. This document intentionally does not create `data/regions/ng-lagos/game-data.json`, invent coordinates or quiz answers, add photos, change the running loader, or modify any Supabase schema/RPC. The first practical pilot should be the compact Onikan cluster, but it must not be activated until the checks above are completed.
