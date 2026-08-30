/**
 * A simple in-memory cache to store API responses on the client side.
 * This prevents re-fetching data when navigating back and forth between pages.
 */
const cache: Record<string, any> = {};

export const clientCache = {
  get: (key: string) => cache[key],
  set: (key: string, data: any) => {
    cache[key] = data;
  },
  has: (key: string) => !!cache[key]
};
