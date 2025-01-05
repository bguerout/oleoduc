import {Duplex, DuplexOptions, Readable, Writable} from "node:stream";

type DuplexerCallback = (error?: Error | null) => void;

export class Duplexer extends Duplex {
    private input: Writable;
    private output: Readable;

    constructor(input: Writable, output: Readable, options?: DuplexOptions) {
        super(options || {writableObjectMode: true, readableObjectMode: true});
        this.input = input;
        this.output = output;
        this.output.on("end", () => this.push(null));
        this.output.on("data", (chunk) => {
            const backpressure = !this.push(chunk);
            if (backpressure) {
                this.output.pause();
            }
        });
    }
    _write(chunk: unknown, encoding: BufferEncoding, callback: DuplexerCallback) {
        this.input.write(chunk, encoding, callback);
    }
    _final(callback: DuplexerCallback) {
        this.input.end(null, callback);
    }
    _read() {
        this.output.resume();
    }
}
