import { deepStrictEqual, strictEqual, fail } from "assert";
import { accumulateData, writeData } from "../src/index";
import { createStream } from "./testUtils";

describe("accumulateData", () => {
  it("can accumulateData by grouping them (flush)", (done) => {
    const result = [];
    const source = createStream();
    source.push("John");
    source.push("Doe");
    source.push("Robert");
    source.push("Hue");
    source.push(null);

    source
      .pipe(
        accumulateData(
          (acc, data, flush) => {
            acc = [...acc, data];

            if (acc.length < 2) {
              return acc;
            }

            flush(acc.join(" "));
            return []; // Reset accumulator
          },
          { accumulator: [] },
        ),
      )
      .pipe(writeData((data) => result.push(data)))
      .on("finish", () => {
        deepStrictEqual(result, ["John Doe", "Robert Hue"]);
        done();
      });
  });

  it("can accumulateData into a single chunk (no flush)", (done) => {
    const result = [];
    const source = createStream();
    source.push("j");
    source.push("o");
    source.push("h");
    source.push("n");
    source.push(null);

    source
      .pipe(accumulateData((acc, data) => acc + data, { accumulator: "" }))
      .pipe(writeData((data) => result.push(data)))
      .on("finish", () => {
        deepStrictEqual(result, ["john"]);
        done();
      });
  });

  it("should catch error in accumulateData", (done) => {
    const result = [];
    const source = createStream();
    source.push("a");
    source.push(null);

    const accumulator = accumulateData(() => {
      throw new Error("Unable to hande data");
    });
    accumulator.on("error", (e) => {
      strictEqual(e.message, "Unable to hande data");
      done();
    });

    source
      .pipe(accumulator)
      .pipe(writeData((data) => result.push(data)))
      .on("finish", () => {
        fail();
        done();
      });
  });
});
