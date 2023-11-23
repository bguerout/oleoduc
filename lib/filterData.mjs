import { transformData } from "./transformData.mjs";

export function filterData(filter, options = {}) {
  return transformData((data) => data, { ...options, filter });
}
