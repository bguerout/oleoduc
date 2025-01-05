import {Readable, TransformOptions} from "node:stream";
import {parseArgs} from "./utils/parseArgs.ts";
import {wrapStreams} from "./utils/wrapStreams.ts";
import {isReadableStream} from "./utils/isReadableStream.ts";
import {decorateWithAsyncIterator} from "./utils/decorateWithAsyncIterator.ts";
import {pipeStreamsTogether} from "./utils/pipeStreamsTogether.ts";
import {AnyStream, PipeableStreams} from "./types.ts";

export type ComposeOptions = TransformOptions;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type ComposeReturn<TLast extends AnyStream> = TLast extends Readable
    ? NodeJS.ReadWriteStream & Readable
    : NodeJS.ReadWriteStream;

export function compose<TLast extends NodeJS.ReadWriteStream | NodeJS.WritableStream>(
    ...args: PipeableStreams<NodeJS.ReadableStream | NodeJS.ReadWriteStream, TLast, ComposeOptions>
): ComposeReturn<TLast> {
    const {params: streams, options} = parseArgs<AnyStream, ComposeOptions>(args);

    const {first, last, wrapper} = wrapStreams(streams, options);

    if (isReadableStream(last)) {
        decorateWithAsyncIterator(wrapper as Readable);
    }

    if (wrapper !== last && wrapper !== first) {
        last.on("finish", () => wrapper.emit("finish")); // Needed by nodejs 12 and previous
        last.on("close", () => wrapper.emit("close"));
    }

    pipeStreamsTogether(streams, wrapper);

    return wrapper as ComposeReturn<TLast>;
}
