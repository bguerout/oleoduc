const assert = require("assert");
const { Readable } = require("stream");
const { ignoreEmpty } = require("../index");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe(__filename, () => {
  it("should ignoreEmpty", (done) => {
    let chunks = [];
    let source = createStream();
    source.push("first");
    source.push("");
    source.push(null);

    source
      .pipe(ignoreEmpty())
      .on("data", (d) => chunks.push(d))
      .on("end", () => {
        assert.deepStrictEqual(chunks, ["first"]);
        done();
      });
  });
});
