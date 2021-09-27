const assert = require("assert");
const { Readable } = require("stream");
const { mergeStreams, writeData } = require("../index");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe(__filename, () => {
  it("can merge multiple streams", (done) => {
    let result = "";
    let source1 = createStream();
    source1.push("andré");
    source1.push(null);

    let source2 = createStream();
    source2.push("bruno");
    source2.push(null);

    mergeStreams(source1, source2)
      .pipe(writeData((data) => (result += data)))
      .on("finish", () => {
        assert.deepStrictEqual(result, "andrébruno");
        done();
      });
  });

  it("can iterate over a merged stream", async () => {
    let source1 = createStream();
    source1.push("andré");
    source1.push(null);

    let source2 = createStream();
    source2.push("bruno");
    source2.push(null);

    let chunks = [];
    for await (const chunk of mergeStreams(source1, source2)) {
      chunks.push(chunk);
    }

    assert.deepStrictEqual(chunks, ["andré", "bruno"]);
  });
});
