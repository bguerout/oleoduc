const assert = require("assert");
const { Readable } = require("stream");
const { readLineByLine, writeData } = require("../index");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe(__filename, () => {
  it("can read a stream line by line", (done) => {
    let result = [];
    let source = createStream();
    source.push("ab");
    source.push("c\ndef\ng");
    source.push("hi\n");
    source.push(null);

    source
      .pipe(readLineByLine())
      .pipe(
        writeData((data) => {
          return result.push(data);
        })
      )
      .on("finish", () => {
        assert.deepStrictEqual(result, ["abc", "def", "ghi"]);
        done();
      });
  });

  it("can handle content without carriage return on the last line", (done) => {
    let result = [];
    let source = createStream();
    source.push("ab\n");
    source.push("hi");
    source.push(null);

    source
      .pipe(readLineByLine())
      .pipe(
        writeData((data) => {
          return result.push(data);
        })
      )
      .on("finish", () => {
        assert.deepStrictEqual(result, ["ab", "hi"]);
        done();
      });
  });
});
