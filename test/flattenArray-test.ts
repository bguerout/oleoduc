import {deepStrictEqual} from "assert";
import {accumulateData, flattenArray, writeData} from "../src/index.ts";
import {createSlowStream, streamArray} from "./testUtils.ts";

describe("flattenArray", () => {
    it("can flat map an array", (done) => {
        let result = "";
        const source = streamArray([["andré", "bruno"]]);

        source
            .pipe(flattenArray())
            .pipe(
                writeData((data) => {
                    result += data;
                }),
            )
            .on("finish", () => {
                deepStrictEqual(result, "andrébruno");
                done();
            });
    });

    it("can flat map an array inside a pipeline", (done) => {
        let result = "";
        const source = streamArray();
        source.push("andré");
        source.push("bruno");
        source.push(null);

        source
            .pipe(
                accumulateData(
                    (acc, data: string) => {
                        return [...acc, data.substring(0, 1)];
                    },
                    {accumulator: [] as string[]},
                ),
            )
            .pipe(flattenArray())
            .pipe(
                writeData((data: string) => {
                    result += data.toUpperCase();
                }),
            )
            .on("finish", () => {
                deepStrictEqual(result, "AB");
                done();
            });
    });

    it("should stop when down streams are busy", (done) => {
        let result = "";
        const source = streamArray();
        source.push(["andré", "bruno", "robert"]); //fill the buffer
        source.push(["john", "henri"]);
        source.push(null);

        source
            .pipe(flattenArray({objectMode: true, highWaterMark: 1}))
            .pipe(createSlowStream({maxWriteInterval: 10})) // Force up streams to be paused
            .pipe(
                writeData((data) => {
                    result += "_" + data;
                }),
            )
            .on("finish", () => {
                deepStrictEqual(result, "_andré_bruno_robert_john_henri");
                done();
            });
    });
});
