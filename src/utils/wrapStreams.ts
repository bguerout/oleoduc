import {Duplexer} from "./Duplexer";
import {PassThrough, TransformOptions} from "stream";
import {isReadableStream} from "./isReadableStream";
import {isWritableStream} from "./isWriteableStream";
import {AnyStream} from "../types";

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
