import {PassThrough, TransformOptions} from "stream";
import {Duplexer} from "./Duplexer.ts";
import {isReadableStream} from "./isReadableStream.ts";
import {isWritableStream} from "./isWriteableStream.ts";
import {AnyStream} from "../types.ts";

export function wrapStreams(streams: AnyStream[], options: TransformOptions = {}) {
    if (streams.length === 0) {
        throw new Error("You must provide at least one stream");
    }

    const first = streams[0];
    const last = streams[streams.length - 1];

    let wrapper: AnyStream;
    if (first === last) {
        wrapper = first;
    } else if (isWritableStream(first) && isReadableStream(last)) {
        wrapper = new Duplexer(first, last, options);
    } else if (isWritableStream(first)) {
        wrapper = first;
    } else if (isReadableStream(first)) {
        wrapper = last;
    } else {
        wrapper = new PassThrough(options);
    }

    return {first, last, wrapper};
}
