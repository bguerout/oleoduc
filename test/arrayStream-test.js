const assert = require("assert");
const { Readable } = require("stream");
const { arrayStream, accumulateData, writeData } = require("../index");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe(__filename, () => {
  it("can stream array", (done) => {
    let result = "";
    let source = createStream();
    source.push(["andré", "bruno"]);
    source.push(null);

    source
      .pipe(arrayStream())
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

  it("can stream array inside a pipeline", (done) => {
    let result = [];
    let source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push(null);

    source
      .pipe(accumulateData((acc, data) => [...acc, data.substring(0, 1)], { accumulator: [] }))
      .pipe(arrayStream())
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
