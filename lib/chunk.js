const oleoduc = require("./oleoduc");
const accumulateData = require("./accumulateData");

module.exports = (opts = {}) => {
  let size = opts.size || 1;
  let options = { accumulator: [], ...opts };

  return oleoduc(
    accumulateData((acc, data, flush) => {
      let current = [...acc, data];
      if (current.length === size) {
        flush(current);
        return [];
      } else {
        return current;
      }
    }, options),

    { promisify: false }
  );
};
