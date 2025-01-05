import {Transform, TransformCallback, TransformOptions} from "stream";

/**
 * Inspired by https://stackoverflow.com/a/43811543/122975
 */
class TransformArray<T = unknown> extends Transform {
    private _resumeTransform: (() => void) | null;

    constructor(options?: TransformOptions) {
        super(options);
        this._resumeTransform = null;
    }

    _transform(chunk: Array<T> | T, encoding: BufferEncoding, callback: TransformCallback) {
        const array = Array.isArray(chunk) ? chunk : [chunk];
        let index = 0;
        const pushArrayItems = () => {
            while (index < array.length) {
                const item = array[index++];
                const backpressure = !this.push(item);
                if (backpressure) {
                    //Stop pushing items and prepare process to be resumed when read function will be called again.
                    this._resumeTransform = pushArrayItems;
                    return;
                }
            }

            this._resumeTransform = null;
            return callback();
        };

        //Start pushing array items
        pushArrayItems();
    }
    _read(size: number) {
        if (this._resumeTransform !== null) {
            //Ensure every items from the previous transform has been pushed
            this._resumeTransform();
        }
        super._read(size);
    }
}

export function flattenArray(options: TransformOptions = {}): Transform {
    return new TransformArray({objectMode: true, ...options});
}
