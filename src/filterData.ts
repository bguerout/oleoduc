import { transformData } from "./transformData";

export function filterData(filter, options = {}) {
  return transformData((data) => data, { ...options, filter });
}
