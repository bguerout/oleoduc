import { deepStrictEqual } from "assert";
import SlowStream from "slow-stream";
import { accumulateData, flattenArray, writeData } from "../src";
import { streamArray } from "./testUtils";

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
    let result = [];
    const source = streamArray();
    source.push("andré");
    source.push("bruno");
    source.push(null);

    source
      .pipe(accumulateData((acc, data) => [...acc, data.substring(0, 1)], { accumulator: [] }))
      .pipe(flattenArray())
      .pipe(
        writeData((data) => {
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
      .pipe(flattenArray({ objectMode: true, highWaterMark: 1 }))
      .pipe(new SlowStream({ maxWriteInterval: 10 })) // Force up streams to be paused
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
