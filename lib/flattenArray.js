const { Transform } = require("stream");

/**
 * Inspired by https://stackoverflow.com/a/43811543/122975
 */
class TransformArray extends Transform {
  constructor(options) {
    super(options);
    this._resumeTransform = null;
  }
  _transform(chunk, encoding, callback) {
    let array = Array.isArray(chunk) ? chunk : [chunk];
    let index = 0;
    let pushArrayItems = () => {
      while (index < array.length) {
        let item = array[index++];
        let backpressure = !this.push(item);
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

module.exports = (options = {}) => {
  return new TransformArray({ objectMode: true, ...options });
};
