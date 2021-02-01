const assert = require("assert");
const { Readable } = require("stream");
const { flatMapStream, accumulateData, writeData } = require("../index");
const SlowStream = require("slow-stream");

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
      .pipe(flatMapStream())
      .pipe(new SlowStream({ maxWriteInterval: 100 }))
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
      .pipe(flatMapStream())
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
});
