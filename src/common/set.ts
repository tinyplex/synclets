export const setNew = <Value>(entries?: Value[]): Set<Value> =>
  new Set(entries);

export const setHas = <Value>(set: Set<Value>, value: Value) => set.has(value);

export const setAdd = <Value>(set: Set<Value>, value: Value) => set.add(value);

export const setEvery = <Value>(
  set: Set<Value>,
  test: (value: Value) => boolean,
) => Array.from(set).every(test);
