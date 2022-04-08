const { Transform } = require("stream");

/**
 * Inspired by https://stackoverflow.com/a/43811543/122975
 */
class TransformArray extends Transform {
  constructor(options) {
    super(options);
    this._resume = null;
  }

  _transform(chunk, encoding, callback) {
    let array = Array.isArray(chunk) ? chunk : [chunk];
    let index = 0;
    let pushArrayItems = () => {
      while (index < array.length) {
        let backpressure = !this.push(array[index++]);
        if (backpressure) {
          //Allows push to be resumed when backpressured is detected
          this._resume = pushArrayItems;
          return;
        }
      }

      this._resume = null;
      return callback();
    };

    //Start pushing array items
    pushArrayItems();
  }
  _read(size) {
    if (this._resume !== null) {
      this._resume();
    }
    super._read(size);
  }
}

module.exports = (options = {}) => {
  return new TransformArray({ objectMode: true, ...options });
};
