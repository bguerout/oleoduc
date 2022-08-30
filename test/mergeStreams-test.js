const assert = require("assert");
const { mergeStreams, writeData } = require("../index");
const { createStream } = require("./testUtils");

describe("mergeStreams", () => {
  it("can merge streams", (done) => {
    let result = "";
    const source1 = createStream(["andré"]);
    const source2 = createStream(["bruno"]);

    mergeStreams(source1, source2)
      .pipe(writeData((data) => (result += data)))
      .on("finish", () => {
        assert.deepStrictEqual(result, "andrébruno");
        done();
      });
  });

  it("can iterate over a merged stream", async () => {
    const source1 = createStream(["andré"]);
    const source2 = createStream(["bruno"]);

    const chunks = [];
    for await (const chunk of mergeStreams(source1, source2)) {
      chunks.push(chunk);
    }

    assert.deepStrictEqual(chunks, ["andré", "bruno"]);
  });
});
