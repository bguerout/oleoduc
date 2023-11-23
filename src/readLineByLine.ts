import { accumulateData } from "./accumulateData";
import { flattenArray } from "./flattenArray";
import { compose } from "./compose";

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
      { accumulator: "", readableObjectMode: true, writableObjectMode: false },
    ),
    flattenArray(),
  );
}
