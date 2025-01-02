import { TransformDataCallback, transformData, TransformDataOptions } from "./transformData";
import { Transform } from "node:stream";

export function filterData<TInput>(
  filter: TransformDataCallback<TInput, boolean | null>,
  options: TransformDataOptions<TInput> = {},
): Transform {
  return transformData((data) => data, { ...options, filter });
}
