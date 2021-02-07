const oleoduc = require("./oleoduc");
const accumulateData = require("./accumulateData");
const flattenArray = require("./flattenArray");

module.exports = (opts = {}) => {
  let options = { accumulator: "", readableObjectMode: true, writableObjectMode: false, ...opts };

  return oleoduc(
    accumulateData((acc, data, flush) => {
      let lines = data.toString().split(/\r?\n/);
      let rest = lines.pop();

      if (lines.length > 0) {
        lines[0] = acc + lines[0];
        flush(lines);
        return rest;
      }

      return acc + rest;
    }, options),
    flattenArray(),
    { promisify: false }
  );
};
