import assert from "assert";
import { mergeStreams, writeData } from "../index.mjs";
import { streamArray } from "./testUtils.mjs";

describe("mergeStreams", () => {
  it("can merge streams", (done) => {
    let result = "";
    const source1 = streamArray(["andré"]);
    const source2 = streamArray(["bruno"]);

    mergeStreams(source1, source2)
      .pipe(writeData((data) => (result += data)))
      .on("finish", () => {
        assert.deepStrictEqual(result, "andrébruno");
        done();
      });
  });

  it("can iterate over a merged stream", async () => {
    const source1 = streamArray(["andré"]);
    const source2 = streamArray(["bruno"]);

    const chunks = [];
    for await (const chunk of mergeStreams(source1, source2)) {
      chunks.push(chunk);
    }

    assert.deepStrictEqual(chunks, ["andré", "bruno"]);
  });
});
