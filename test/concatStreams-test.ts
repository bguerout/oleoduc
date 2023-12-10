import { deepStrictEqual } from "assert";
import { concatStreams, writeData } from "../src/index";
import { delay, streamArray } from "./testUtils";

describe("concatStreams", () => {
  it("can concat streams", (done) => {
    let result = "";
    const source1 = streamArray(["andré"]);
    const source2 = streamArray(["bruno"]);

    concatStreams(source1, source2)
      .pipe(writeData((data) => (result += data)))
      .on("finish", () => {
        deepStrictEqual(result, "andrébruno");
        done();
      });
  });

  it("can concat streams (next function)", (done) => {
    let result = "";
    const array = [streamArray(["andré"]), streamArray(["bruno"])];
    const next = () => array.shift();

    concatStreams(next)
      .pipe(writeData((data) => (result += data)))
      .on("finish", () => {
        deepStrictEqual(result, "andrébruno");
        done();
      });
  });

  it("can concat streams (async next function)", (done) => {
    let result = "";
    const array = [streamArray(["andré"]), streamArray(["bruno"])];
    const next = () => Promise.resolve(array.shift());

    concatStreams(next)
      .pipe(writeData((data) => (result += data)))
      .on("finish", () => {
        deepStrictEqual(result, "andrébruno");
        done();
      });
  });

  it("can concat streams (slow async next)", (done) => {
    let result = "";
    const array = [streamArray(["andré"]), streamArray(["bruno"])];
    const next = () => delay(() => array.shift(), 2);

    concatStreams(next)
      .pipe(writeData((data) => (result += data)))
      .on("finish", () => {
        deepStrictEqual(result, "andrébruno");
        done();
      });
  });

  it("can iterate over concatStreams", async () => {
    const source1 = streamArray(["andré"]);
    const source2 = streamArray(["bruno"]);

    const chunks = [];
    for await (const chunk of concatStreams(source1, source2)) {
      chunks.push(chunk);
    }

    deepStrictEqual(chunks, ["andré", "bruno"]);
  });
});
