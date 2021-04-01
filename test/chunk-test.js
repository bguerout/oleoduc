const assert = require("assert");
const { Readable } = require("stream");
const { chunk, writeData } = require("../index");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe(__filename, () => {
  it("can create chunks", (done) => {
    let results = [];
    let source = createStream();
    source.push("abc");
    source.push("def");
    source.push("ghi");
    source.push(null);

    source
      .pipe(chunk())
      .pipe(
        writeData((group) => {
          return results.push(group);
        })
      )
      .on("finish", () => {
        assert.deepStrictEqual(results, [["abc"], ["def"], ["ghi"]]);
        done();
      });
  });

  it("can create chunks with custom size", (done) => {
    let results = [];
    let source = createStream();
    source.push("abc");
    source.push("def");
    source.push("ghi");
    source.push(null);

    source
      .pipe(chunk({ size: 2 }))
      .pipe(
        writeData((group) => {
          return results.push(group);
        })
      )
      .on("finish", () => {
        assert.deepStrictEqual(results, [["abc", "def"], ["ghi"]]);
        done();
      });
  });
});
