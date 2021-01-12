const { Transform } = require("stream");

const streamArray = function (array, index, transformer, callback) {
  if (index === array.length) {
    return callback();
  }

  //Handle back pressure because consuming a single written chunk can produce multiple readable data
  if (transformer.push(array[index]) === false) {
    return transformer.once("drain", () => {
      streamArray(array, index + 1, transformer, callback);
    });
  } else {
    streamArray(array, index + 1, transformer, callback);
  }
};

module.exports = (converter = (c) => c) => {
  return new Transform({
    objectMode: true,
    transform: function (chunk, encoding, callback) {
      try {
        let array = converter(chunk);
        streamArray(array, 0, this, callback);
      } catch (e) {
        callback(e);
      }
    },
  });
};
