import {TransformOptions} from "stream";
import {parseArgs} from "./utils/parseArgs.ts";
import {AnyStream, PipeableStreams} from "./types.ts";
import {wrapStreams} from "./utils/wrapStreams.ts";
import {pipeStreamsTogether} from "./utils/pipeStreamsTogether.ts";

export type OleoducOptions = TransformOptions;

export function oleoduc(
    ...args: PipeableStreams<NodeJS.ReadableStream, NodeJS.WritableStream, OleoducOptions>
): Promise<void> {
    const {params: streams, options} = parseArgs<AnyStream, OleoducOptions>(args);

    if (streams.length === 0) {
        throw new Error("You must provide at least one stream");
    }

    const {wrapper, last} = wrapStreams(streams, options);
    pipeStreamsTogether(streams, wrapper);

    return new Promise((resolve, reject) => {
        wrapper.on("error", (e) => reject(e));
        last.on("finish", resolve); // Needed by nodejs 12 and previous
        last.on("close", resolve);
    });
}
