export function getEnumValues<T extends Record<string, string>>(object: T) {
  return Object.values(object);
}
