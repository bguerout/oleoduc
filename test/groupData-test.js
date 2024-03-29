const assert = require("assert");
const { createStream } = require("./testUtils.js");
const { groupData, writeData } = require("../index");

describe("groupData", () => {
  it("can create group of data", (done) => {
    const results = [];
    const source = createStream();
    source.push("abc");
    source.push("def");
    source.push("ghi");
    source.push(null);

    source
      .pipe(groupData())
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

  it("can create group of data with custom size", (done) => {
    const results = [];
    const source = createStream();
    source.push("abc");
    source.push("def");
    source.push("ghi");
    source.push(null);

    source
      .pipe(groupData({ size: 2 }))
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
