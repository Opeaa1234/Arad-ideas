// Loads and validates the selectable trails and independent side quests.
function requiredText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateTrivia(place) {
  if (!Array.isArray(place.trivia)) return;
  place.trivia.forEach((question, index) => {
    if (!question || typeof question !== 'object') {
      throw new Error('Question ' + (index + 1) + ' at "' + place.id + '" must be an object.');
    }
    // Explicit placeholders are allowed while the content team finishes a stop.
    if (question.placeholder === true) return;
    if (!requiredText(question.q) || !Array.isArray(question.o) || question.o.length < 2 ||
        question.o.some(option => !requiredText(option)) ||
        !Number.isInteger(question.a) || question.a < 0 || question.a >= question.o.length) {
      throw new Error('Question ' + (index + 1) + ' at "' + place.id + '" needs a question, at least two answer options and a valid answer index.');
    }
  });
}

export async function loadTrail() {
  const res = await fetch('data/game-data.json', { cache: 'no-cache' });
  if (!res.ok) throw new Error('data/game-data.json (HTTP ' + res.status + ')');
  const data = await res.json();
  if (!data || !Array.isArray(data.routes) || !Array.isArray(data.places) || !Array.isArray(data.sidequests)) {
    throw new Error('The game data must contain routes, places and sidequests.');
  }

  const seenPlaceIds = new Set();
  const places = data.places.map(p => {
    if (!p || typeof p !== 'object' || !requiredText(p.id) || !requiredText(p.name)) {
      throw new Error('Each location needs a non-empty id and name.');
    }
    if (seenPlaceIds.has(p.id)) throw new Error('Duplicate location id "' + p.id + '".');
    seenPlaceIds.add(p.id);

    const lat = Number(p.lat), lon = Number(p.lon);
    if (p.lat === null || p.lat === '' || !Number.isFinite(lat) || lat < -90 || lat > 90 ||
        p.lon === null || p.lon === '' || !Number.isFinite(lon) || lon < -180 || lon > 180) {
      throw new Error('Location "' + p.id + '" needs valid latitude and longitude coordinates.');
    }
    validateTrivia(p);
    return {
      ...p, lat, lon, short: p.short || p.name, category: p.category || '',
      kind: p.kind || '', address: p.address || '', hint: p.hint || '',
      photo: p.photo || '', photoCredit: p.photoCredit || '', wikipedia: p.wikipedia || '',
      text: Array.isArray(p.text) ? p.text : [], trivia: Array.isArray(p.trivia) ? p.trivia : [],
    };
  });

  const byId = new Map(places.map(p => [p.id, p]));
  const seenRouteIds = new Set();
  const routes = data.routes.map(route => {
    if (!route || typeof route !== 'object' || !requiredText(route.id) || !requiredText(route.name) ||
        !Array.isArray(route.locationIds) || !route.locationIds.length) {
      throw new Error('Each route needs an id, name and at least one location.');
    }
    if (seenRouteIds.has(route.id)) throw new Error('Duplicate route id "' + route.id + '".');
    seenRouteIds.add(route.id);
    const seenRoutePlaces = new Set();
    route.locationIds.forEach(id => {
      if (!byId.has(id)) throw new Error('Unknown location "' + id + '" in route "' + route.id + '".');
      if (seenRoutePlaces.has(id)) throw new Error('Duplicate location "' + id + '" in route "' + route.id + '".');
      seenRoutePlaces.add(id);
    });
    return route;
  });

  const seenSidequests = new Set();
  const sidequests = data.sidequests.map(s => {
    if (!s || typeof s !== 'object' || !requiredText(s.id)) {
      throw new Error('Each side quest needs a location id.');
    }
    if (!byId.has(s.id)) throw new Error('Unknown side quest location "' + s.id + '".');
    if (seenSidequests.has(s.id)) throw new Error('Duplicate side quest location "' + s.id + '".');
    seenSidequests.add(s.id);
    return { ...s, place: byId.get(s.id) };
  });

  return { places, routes, sidequests, warnings: data.coordinate_note ? [data.coordinate_note] : [] };
}
