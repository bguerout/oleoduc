import {accumulateData} from "./accumulateData.ts";
import {flattenArray} from "./flattenArray.ts";
import {pipeStreams} from "./pipeStreams.ts";

export function readLineByLine() {
    return pipeStreams(
        accumulateData<string, string[]>(
            (acc, data: string, flush) => {
                const lines = data.toString().split(/\r?\n/);
                const rest = lines.pop() || "";

                if (lines.length > 0) {
                    lines[0] = acc + lines[0];
                    flush(lines);
                    return rest;
                }

                return acc + rest;
            },
            {accumulator: "", readableObjectMode: true, writableObjectMode: false},
        ),
        flattenArray(),
    );
}
