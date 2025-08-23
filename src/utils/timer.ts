export const delay = (ms: number) => new Promise(resolve => globalThis.setTimeout(resolve, ms));
