import transform from "parallel-transform";
import { Transform, TransformOptions } from "node:stream";
import { TransformCallback } from "stream";

export type TransformDataCallback<TInput, TOutput> = (data: TInput) => Promise<TOutput> | TOutput;
export type TransformDataOptions<TInput> = {
  filter?: TransformDataCallback<TInput, boolean | null>;
  parallel?: number;
} & TransformOptions;

export function transformData<TInput, TOutput = TInput>(
  callback: TransformDataCallback<TInput, TOutput | null>,
  options: TransformDataOptions<TInput> = {},
): Transform {
  const { filter, parallel, ...rest } = options;
  const filterChunk = (value: TInput) => !filter || filter(value);
  const maxParallel = parallel || 1;

  return transform(maxParallel, { objectMode: true, ...rest }, async (chunk: TInput, cb: TransformCallback) => {
    try {
      if (!(await filterChunk(chunk))) {
        return cb(null, null);
      }
      const res = await callback(chunk);
      cb(null, res);
    } catch (e) {
      cb(e as Error);
    }
  });
}
