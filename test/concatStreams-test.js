const assert = require("assert");
const { concatStreams, writeData } = require("../index");
const { createStream } = require("./testUtils");
const { delay } = require("./testUtils.js");

describe("concatStreams", () => {
  it("can concat streams", (done) => {
    let result = "";
    const source1 = createStream(["andré"]);
    const source2 = createStream(["bruno"]);

    concatStreams(source1, source2)
      .pipe(writeData((data) => (result += data)))
      .on("finish", () => {
        assert.deepStrictEqual(result, "andrébruno");
        done();
      });
  });

  it("can concat streams (next function)", (done) => {
    let result = "";
    const array = [createStream(["andré"]), createStream(["bruno"])];

    concatStreams(() => array.shift())
      .pipe(writeData((data) => (result += data)))
      .on("finish", () => {
        assert.deepStrictEqual(result, "andrébruno");
        done();
      });
  });

  it("can concat streams (async next function)", (done) => {
    let result = "";
    const array = [createStream(["andré"]), createStream(["bruno"])];

    concatStreams(() => Promise.resolve(array.shift()))
      .pipe(writeData((data) => (result += data)))
      .on("finish", () => {
        assert.deepStrictEqual(result, "andrébruno");
        done();
      });
  });

  it("can concat streams (slow async next)", (done) => {
    let result = "";
    const array = [createStream(["andré"]), createStream(["bruno"])];
    const next = () => delay(() => array.shift(), 2);

    concatStreams(next)
      .pipe(writeData((data) => (result += data)))
      .on("finish", () => {
        assert.deepStrictEqual(result, "andrébruno");
        done();
      });
  });

  it("can iterate over concatStreams", async () => {
    const source1 = createStream(["andré"]);
    const source2 = createStream(["bruno"]);

    const chunks = [];
    for await (const chunk of concatStreams(source1, source2)) {
      chunks.push(chunk);
    }

    assert.deepStrictEqual(chunks, ["andré", "bruno"]);
  });
});
