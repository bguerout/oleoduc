const accumulateData = require("./accumulateData");
const flattenArray = require("./flattenArray");
const compose = require("./compose");

function readLineByLine() {
  return compose(
    accumulateData(
      (acc, data, flush) => {
        const lines = data.toString().split(/\r?\n/);
        const rest = lines.pop();

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
}

module.exports = readLineByLine;
