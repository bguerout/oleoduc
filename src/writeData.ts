import {WritableOptions, Writable} from "stream";
// @ts-expect-error TS2792
import cyclist, {Cyclist} from "cyclist";

export type WriteDataOptions = {parallel?: number};
export type WriteDataCallback<TInput> = (data: TInput) => void | unknown;

type ParallelWriteOptions = WritableOptions & {ordered?: boolean};
type ParallelOnWrite<TInput> = (chunk: TInput, callback: (e?: Error | null, data?: unknown) => void) => void;
type ParallelOnDrain = () => void;

class ParallelWrite<TInput> extends Writable {
    private _maxParallel: number;
    private _onWrite: ParallelOnWrite<TInput>;
    private _destroyed: boolean;
    private _flushed: boolean;
    private _ordered: boolean;
    private _buffer: Cyclist | Array<TInput>;
    private _top: number;
    private _bottom: number;
    private _ondrain: ParallelOnDrain | null;

    constructor(maxParallel: number, opts: ParallelWriteOptions | null, onWrite: ParallelOnWrite<TInput>) {
        super();
        if (typeof maxParallel === "function") {
            onWrite = maxParallel;
            opts = null;
            maxParallel = 1;
        }
        if (typeof opts === "function") {
            onWrite = opts;
            opts = null;
        }

        if (!opts) opts = {};
        if (!opts.highWaterMark) opts.highWaterMark = Math.max(maxParallel, 16);
        if (opts.objectMode !== false) opts.objectMode = true;

        Writable.call(this, opts);

        this._maxParallel = maxParallel;
        this._onWrite = onWrite;
        this._destroyed = false;
        this._flushed = false;
        this._ordered = opts.ordered !== false;
        this._buffer = this._ordered ? cyclist(maxParallel) : [];
        this._top = 0;
        this._bottom = 0;
        this._ondrain = null;
    }

    _destroy() {
        if (this._destroyed) return;
        this._destroyed = true;
        this.emit("close");
    }

    _write(chunk: TInput, enc: BufferEncoding, callback: ParallelOnDrain) {
        const pos = this._top++;

        this._onWrite(chunk, (err, data) => {
            if (this._destroyed) return;
            if (err) {
                this.emit("error", err);
                this.destroy();
                return;
            }
            if (this._isOrdered(this._buffer)) {
                this._buffer.put(pos, data === undefined || data === null ? null : data);
            } else {
                this._buffer.push(data as TInput);
            }
            this._drain();
        });

        if (this._top - this._bottom < this._maxParallel) return callback();
        this._ondrain = callback;
    }

    _final(callback: ParallelOnDrain) {
        this._flushed = true;
        this._ondrain = callback;
        this._drain();
    }

    _drain() {
        if (this._isOrdered(this._buffer)) {
            while (this._buffer.get(this._bottom) !== undefined) {
                this._buffer.del(this._bottom++);
            }
        } else {
            while (this._buffer.length > 0) {
                this._buffer.pop();
                this._bottom++;
            }
        }

        if (!this._drained() || !this._ondrain) return;

        const ondrain = this._ondrain;
        this._ondrain = null;
        ondrain();
    }

    _isOrdered(buffer: Cyclist | Array<TInput>): buffer is Cyclist {
        return this._ordered;
    }

    _drained() {
        const diff = this._top - this._bottom;
        return this._flushed ? !diff : diff < this._maxParallel;
    }
}

export function writeData<TInput>(
    callback: WriteDataCallback<TInput>,
    options: WriteDataOptions = {},
): NodeJS.WritableStream {
    return new ParallelWrite<TInput>(options.parallel || 1, {objectMode: true}, async (chunk, cb) => {
        try {
            const res = await callback(chunk);
            cb(null, res);
        } catch (e) {
            cb(e as Error);
        }
    });
}
