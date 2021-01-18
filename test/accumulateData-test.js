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
  it("can accumulateData into new chunks", (done) => {
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
            return acc.length === 3 ? flush(acc) : acc;
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

  it("can accumulateData into a single new chunk (no flush)", (done) => {
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
});
