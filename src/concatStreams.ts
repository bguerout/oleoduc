import {PassThrough, TransformOptions} from "node:stream";
import {parseArgs} from "./utils/parseArgs.ts";

type NextStreamCallback = () => Promise<NodeJS.ReadableStream | null> | NodeJS.ReadableStream | null;

class StreamArrayCursor<TStream extends NodeJS.ReadableStream> {
    private array: Array<TStream>;
    private cpt: number;

    constructor(array: Array<TStream>) {
        this.array = array;
        this.cpt = 0;
    }

    next() {
        return this.array[this.cpt++];
    }
}

export function concatStreams(
    ...args:
        | [...streams: NodeJS.ReadableStream[]]
        | [...streams: NodeJS.ReadableStream[], options: TransformOptions]
        | [next: NextStreamCallback]
        | [next: NextStreamCallback, options: TransformOptions]
): NodeJS.ReadWriteStream {
    const {params, options} = parseArgs<NodeJS.ReadableStream | NextStreamCallback, TransformOptions>(args);
    const cursor = asCursor(params);
    const passThrough = new PassThrough({objectMode: true, ...options});
    passThrough.setMaxListeners(0);

    async function concat() {
        const stream = await cursor.next();
        if (!stream) {
            return passThrough.end();
        }

        stream.on("error", (e: Error) => passThrough.emit("error", e));
        stream.on("end", () => concat());
        stream.pipe(passThrough, {end: false});
    }

    concat();

    return passThrough;
}

function isFunction(streams: (NodeJS.ReadableStream | NextStreamCallback)[]) {
    return streams.length === 1 && typeof streams[0] === "function";
}

function asCursor(value: (NodeJS.ReadableStream | NextStreamCallback)[]) {
    if (isFunction(value)) {
        const callbacks = value as NextStreamCallback[];
        return {next: callbacks[0]};
    }
    return new StreamArrayCursor(value as NodeJS.ReadableStream[]);
}
