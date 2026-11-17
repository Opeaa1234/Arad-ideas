// Merge server-confirmed completed places into this device without discarding
// local discoveries or completions. A recorded score means the quiz was finished.
export function mergeRemoteProgress(progress, remoteScores, validPlaceIds) {
  const discovered = [...new Set(progress.discovered)];
  const completed = [...new Set(progress.completed)];
  const discoveredSet = new Set(discovered);
  const completedSet = new Set(completed);

  for (const [id, score] of Object.entries(remoteScores || {})) {
    if (!validPlaceIds.has(id) || !Number.isFinite(Number(score)) || Number(score) < 0) continue;
    if (!discoveredSet.has(id)) {
      discovered.push(id);
      discoveredSet.add(id);
    }
    if (!completedSet.has(id)) {
      completed.push(id);
      completedSet.add(id);
    }
  }

  const changed = discovered.length !== progress.discovered.length ||
    completed.length !== progress.completed.length;
  return { progress: { ...progress, discovered, completed }, changed };
}
