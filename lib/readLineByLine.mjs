import { accumulateData } from "./accumulateData.mjs";
import { flattenArray } from "./flattenArray.mjs";
import { compose } from "./compose.mjs";

export function readLineByLine() {
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
