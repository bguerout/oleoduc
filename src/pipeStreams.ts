import {Readable, TransformOptions} from "stream";
import {parseArgs} from "./utils/parseArgs.ts";
import {wrapStreams} from "./utils/wrapStreams.ts";
import {isReadableStream} from "./utils/isReadableStream.ts";
import {decorateWithAsyncIterator} from "./utils/decorateWithAsyncIterator.ts";
import {pipeStreamsTogether} from "./utils/pipeStreamsTogether.ts";
import {AnyStream, PipeableStreams} from "./types.ts";

export type PipeStreamsOptions = TransformOptions;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type PipeStreamsReturn<TLast extends AnyStream> = TLast extends Readable
    ? NodeJS.ReadWriteStream & Readable
    : NodeJS.ReadWriteStream;

export function pipeStreams<TLast extends NodeJS.ReadWriteStream | NodeJS.WritableStream>(
    ...args: PipeableStreams<NodeJS.ReadableStream | NodeJS.ReadWriteStream, TLast, PipeStreamsOptions>
): PipeStreamsReturn<TLast> {
    const {params: streams, options} = parseArgs<AnyStream, PipeStreamsOptions>(args);

    const {first, last, wrapper} = wrapStreams(streams, options);

    if (isReadableStream(last)) {
        decorateWithAsyncIterator(wrapper as Readable);
    }

    if (wrapper !== last && wrapper !== first) {
        last.on("finish", () => wrapper.emit("finish")); // Needed by nodejs 12 and previous
        last.on("close", () => wrapper.emit("close"));
    }

    pipeStreamsTogether(streams, wrapper);

    return wrapper as PipeStreamsReturn<TLast>;
}
