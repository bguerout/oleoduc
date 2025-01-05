import {Transform, TransformOptions} from "node:stream";

export type AccumulateDataOptions<TAcc> = TransformOptions & {accumulator?: TAcc};
export type AccumulateDataCallback<TInput, TOutput, TAcc> = (
    acc: TAcc,
    data: TInput,
    flush: (data: TOutput) => void,
) => TAcc;

export function accumulateData<TInput, TOutput, TAcc = TInput>(
    accumulate: AccumulateDataCallback<TInput, TOutput, TAcc>,
    options: AccumulateDataOptions<TAcc> = {},
): NodeJS.ReadWriteStream {
    const {accumulator, ...rest} = options;
    let acc = (accumulator === undefined ? null : accumulator) as TAcc;
    let flushed = false;

    return new Transform({
        objectMode: true,
        ...rest,
        transform: async function (chunk, encoding, callback) {
            try {
                flushed = false;
                acc = await accumulate(acc, chunk, (data: TOutput) => {
                    flushed = true;
                    this.push(data);
                });

                callback();
            } catch (e) {
                callback(e as Error);
            }
        },
        flush(callback) {
            if (!flushed) {
                this.push(acc);
            }
            callback();
        },
    });
}
