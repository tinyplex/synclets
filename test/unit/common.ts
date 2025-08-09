export const pause = async (ms = 2) =>
  new Promise((resolve) => setTimeout(resolve, ms));
