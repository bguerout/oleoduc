const assert = require("assert");
const { Readable } = require("stream");
const { accumulateData, writeData } = require("../index");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe(__filename, () => {
  it("can accumulateData by grouping them (flush)", (done) => {
    let result = [];
    let source = createStream();
    source.push("a");
    source.push("b");
    source.push("c");
    source.push("d");
    source.push("e");
    source.push("f");
    source.push(null);

    source
      .pipe(
        accumulateData(
          (acc, data, flush) => {
            acc += data;
            if (acc.length !== 3) {
              return acc;
            }

            flush(acc);
            return ""; // Reset accumulator
          },
          { accumulator: "" }
        )
      )
      .pipe(writeData((data) => result.push(data)))
      .on("finish", () => {
        assert.deepStrictEqual(result, ["abc", "def"]);
        done();
      });
  });

  it("can accumulateData into a single chunk (no flush)", (done) => {
    let result = [];
    let source = createStream();
    source.push("a");
    source.push("b");
    source.push("c");
    source.push("d");
    source.push("e");
    source.push("f");
    source.push(null);

    source
      .pipe(accumulateData((acc, data) => acc + data, { accumulator: "" }))
      .pipe(writeData((data) => result.push(data)))
      .on("finish", () => {
        assert.deepStrictEqual(result, ["abcdef"]);
        done();
      });
  });

  it("should catch error in accumulateData", (done) => {
    let result = [];
    let source = createStream();
    source.push("a");
    source.push(null);

    let accumulator = accumulateData(() => {
      throw new Error("Unable to hande data");
    });
    accumulator.on("error", (e) => {
      assert.strictEqual(e.message, "Unable to hande data");
      done();
    });

    source
      .pipe(accumulator)
      .pipe(writeData((data) => result.push(data)))
      .on("finish", () => {
        assert.fail();
        done();
      });
  });
});
