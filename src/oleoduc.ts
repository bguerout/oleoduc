import {parseArgs} from "./utils/parseArgs";
import {AnyStream, PipeableStreams} from "./types";
import {wrapStreams} from "./utils/wrapStreams";
import {pipeStreamsTogether} from "./utils/pipeStreamsTogether";
import {TransformOptions} from "stream";

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
