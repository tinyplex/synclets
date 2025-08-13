export const setNew = /* @__PURE__ */ <Value>(entries?: Value[]): Set<Value> =>
  new Set(entries);

export const setHas = <Value>(set: Set<Value>, value: Value) => set.has(value);
