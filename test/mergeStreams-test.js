const assert = require("assert");
const { mergeStreams, writeData } = require("../index");
const { createStream } = require("./testUtils");

describe("mergeStreams", () => {
  it("can merge multiple streams", (done) => {
    let result = "";
    let source1 = createStream(["andré"]);
    let source2 = createStream(["bruno"]);

    mergeStreams(source1, source2)
      .pipe(writeData((data) => (result += data)))
      .on("finish", () => {
        assert.deepStrictEqual(result, "andrébruno");
        done();
      });
  });

  it("can merge multiple streams (factory)", (done) => {
    let result = "";
    mergeStreams(
      () => createStream(["andré"]),
      () => createStream(["bruno"])
    )
      .pipe(writeData((data) => (result += data)))
      .on("finish", () => {
        assert.deepStrictEqual(result, "andrébruno");
        done();
      });
  });

  it("can merge multiple streams (async factory)", (done) => {
    let result = "";
    mergeStreams(
      () => Promise.resolve(createStream(["andré"])),
      () => Promise.resolve(createStream(["bruno"]))
    )
      .pipe(writeData((data) => (result += data)))
      .on("finish", () => {
        assert.deepStrictEqual(result, "andrébruno");
        done();
      });
  });

  it("can merge multiple streams (sequentially)", (done) => {
    let result = "";
    let source1 = createStream(["andré"]);
    let source2 = createStream(["bruno"]);

    mergeStreams(source1, source2, { sequential: true })
      .pipe(writeData((data) => (result += data)))
      .on("finish", () => {
        assert.deepStrictEqual(result, "andrébruno");
        done();
      });
  });

  it("can merge multiple streams (sequentially+factory)", (done) => {
    let result = "";
    mergeStreams(
      () => createStream(["andré"]),
      () => createStream(["bruno"]),
      { sequential: true }
    )
      .pipe(writeData((data) => (result += data)))
      .on("finish", () => {
        assert.deepStrictEqual(result, "andrébruno");
        done();
      });
  });

  it("can iterate over a merged stream", async () => {
    let source1 = createStream(["andré"]);
    let source2 = createStream(["bruno"]);

    let chunks = [];
    for await (const chunk of mergeStreams(source1, source2)) {
      chunks.push(chunk);
    }

    assert.deepStrictEqual(chunks, ["andré", "bruno"]);
  });
});
