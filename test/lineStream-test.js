const assert = require("assert");
const { Readable } = require("stream");
const { lineStream, writeData } = require("../index");

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
      .pipe(lineStream())
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
});
