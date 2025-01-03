import {Readable} from "stream";
import {deepStrictEqual} from "assert";
// @ts-expect-error TS7016
import SlowStream from "slow-stream";

export function delay<T>(callback: () => T, delay: number): Promise<T> {
    return new Promise((resolve) => {
        return setTimeout(async () => {
            resolve(callback());
        }, delay);
    });
}

export function streamArray<T>(items: Array<T> = []): Readable {
    return new Readable({
        objectMode: true,
        read() {
            this.push(items.length > 0 ? items.shift() : null);
        },
    });
}

export function createStream() {
    return new Readable({
        objectMode: true,
        read() {},
    });
}

export function assertErrorMessage(e: unknown, message: string) {
    deepStrictEqual((e as Error).message, message);
}

export function createSlowStream(options: {maxWriteInterval?: number} = {}) {
    return new SlowStream(options);
}
