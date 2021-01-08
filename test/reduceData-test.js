const assert = require("assert");
const { Readable } = require("stream");
const { reduceData, writeData } = require("../index");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe(__filename, () => {
  it("can reduceData", (done) => {
    let result = [];
    let source = createStream();
    source.push(1);
    source.push(2);
    source.push(null);

    source
      .pipe(
        reduceData((acc, data) => {
          return acc + data;
        })
      )
      .pipe(
        writeData((data) => {
          result = data;
        })
      )
      .on("finish", () => {
        assert.deepStrictEqual(result, 3);
        done();
      });
  });

  it("can reduceData with custom accumulator", (done) => {
    let result = [];
    let source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push(null);

    source
      .pipe(reduceData((acc, data) => `${acc}${data}`, { initialValue: "" }))
      .pipe(
        writeData((data) => {
          result = data;
        })
      )
      .on("finish", () => {
        assert.deepStrictEqual(result, "andrébruno");
        done();
      });
  });
});
