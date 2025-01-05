import {Transform} from "node:stream";
import {TransformDataCallback, transformData, TransformDataOptions} from "./transformData.ts";

export function filterData<TInput>(
    filter: TransformDataCallback<TInput, boolean | null>,
    options: TransformDataOptions<TInput> = {},
): Transform {
    return transformData((data) => data, {...options, filter});
}
