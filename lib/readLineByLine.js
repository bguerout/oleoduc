const accumulateData = require("./accumulateData");
const flattenArray = require("./flattenArray");
const compose = require("./compose");

module.exports = () => {
  return compose(
    accumulateData(
      (acc, data, flush) => {
        let lines = data.toString().split(/\r?\n/);
        let rest = lines.pop();

        if (lines.length > 0) {
          lines[0] = acc + lines[0];
          flush(lines);
          return rest;
        }

        return acc + rest;
      },
      { accumulator: "", readableObjectMode: true, writableObjectMode: false }
    ),
    flattenArray()
  );
};
