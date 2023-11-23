import { Transform } from "stream";

/**
 * Inspired by https://stackoverflow.com/a/43811543/122975
 */
class TransformArray extends Transform {
  constructor(options) {
    super(options);
    this._resumeTransform = null;
  }
  _transform(chunk, encoding, callback) {
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
  _read(size) {
    if (this._resumeTransform !== null) {
      //Ensure every items from the previous transform has been pushed
      this._resumeTransform();
    }
    super._read(size);
  }
}

export function flattenArray(options = {}) {
  return new TransformArray({ objectMode: true, ...options });
}
