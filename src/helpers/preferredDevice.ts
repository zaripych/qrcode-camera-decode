export function preferredDevice(
  devices: Array<{ id: string; name: string }>,
  preference: string
): string | null {
  const regex = new RegExp(preference);

  const exactMatch = devices.find(item => preference === item.id);
  if (exactMatch) {
    return exactMatch.id;
  }

  const candidates = devices.filter(
    item => regex.test(item.name) || regex.test(item.id)
  );
  if (candidates.length === 0) {
    console.warn(
      `🤔  No device ${devices.map(d => d.id).join(', ')} matches ${regex}`
    );
    return null;
  }

  if (candidates.length > 1) {
    console.warn(
      `🤔  Found more than one device candidate, taking first from the list`,
      candidates
    );
    return candidates[0].id;
  }

  return candidates[0].id;
}
