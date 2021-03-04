const assert = require("assert");
const { Readable } = require("stream");
const { flattenArray, accumulateData, writeData } = require("../index");
const SlowStream = require("slow-stream"); // eslint-disable-line node/no-unpublished-require

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe(__filename, () => {
  it("can flat map an array", (done) => {
    let result = "";
    let source = createStream();
    source.push(["andré", "bruno"]);
    source.push(null);

    source
      .pipe(flattenArray())
      .pipe(
        writeData((data) => {
          result += data;
        })
      )
      .on("finish", () => {
        assert.deepStrictEqual(result, "andrébruno");
        done();
      });
  });

  it("can flat map an array inside a pipeline", (done) => {
    let result = [];
    let source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push(null);

    source
      .pipe(accumulateData((acc, data) => [...acc, data.substring(0, 1)], { accumulator: [] }))
      .pipe(flattenArray())
      .pipe(
        writeData((data) => {
          result += data.toUpperCase();
        })
      )
      .on("finish", () => {
        assert.deepStrictEqual(result, "AB");
        done();
      });
  });

  it("should stop when down streams are busy", (done) => {
    let result = "";
    let source = createStream();
    source.push(["andré", "bruno", "robert"]);
    source.push(null);

    source
      .pipe(flattenArray({ highWaterMark: 1 }))
      .pipe(new SlowStream({ maxWriteInterval: 10 })) // Force up streams to be paused
      .pipe(
        writeData((data) => {
          result += data;
        })
      )
      .on("finish", () => {
        assert.deepStrictEqual(result, "andrébrunorobert");
        done();
      });
  });
});
