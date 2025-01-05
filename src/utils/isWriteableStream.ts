import {Writable} from "stream";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isWritableStream(stream: any): stream is Writable {
    return (
        stream !== null &&
        typeof stream === "object" &&
        typeof stream.write === "function" &&
        typeof stream.end === "function" &&
        typeof stream.writable === "boolean"
    );
}
