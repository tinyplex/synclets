export const mapNew = /* @__PURE__ */ <Key, Value>(
  entries?: [Key, Value][],
): Map<Key, Value> => new Map(entries);

export const mapHas = <Key, Value>(map: Map<Key, Value>, key: Key): boolean =>
  map.has(key);

export const mapGet = <Key, Value>(
  map: Map<Key, Value>,
  key: Key,
): Value | undefined => map.get(key);

export const mapSet = <Key, Value>(
  map: Map<Key, Value>,
  key: Key,
  value: Value,
): Map<Key, Value> | undefined => map.set(key, value);

export const mapDel = <Key, Value>(map: Map<Key, Value>, key: Key) =>
  map?.delete(key);

export const mapEnsure = <Key, Value>(
  map: Map<Key, Value>,
  key: Key,
  getDefaultValue: () => Value,
): Value => {
  if (!mapHas(map, key)) {
    mapSet(map, key, getDefaultValue());
  }
  return mapGet(map, key) as Value;
};

export const mapForEach = <Key, Value>(
  map: Map<Key, Value> | undefined,
  cb: (key: Key, value: Value) => void,
): void => map?.forEach((value, key) => cb(key, value));
