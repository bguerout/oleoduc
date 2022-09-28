const assert = require("assert");
const { writeData, flattenStream, compose, transformData, oleoduc } = require("../index");
const { streamArray } = require("./testUtils");
const SlowStream = require("slow-stream"); // eslint-disable-line node/no-unpublished-require

describe("flattenStream", () => {
  it("can transform a chunk into a stream", (done) => {
    let result = "";
    const stream = streamArray([streamArray(["andré"]), streamArray(["bruno"])]);

    stream
      .pipe(flattenStream())
      .pipe(
        writeData((data) => {
          result += data;
        })
      )
      .on("finish", () => {
        assert.deepStrictEqual(result, "andrébruno");
        done();
      });
  });

  it("should stop transforming when down streams are busy", (done) => {
    let result = "";
    const stream = streamArray([
      streamArray(["andré", "bruno", "robert"]), //fill the buffer
      streamArray(["john"]),
      streamArray(["henri"]),
    ]);

    stream
      .pipe(flattenStream({ objectMode: true, highWaterMark: 1 }))
      .pipe(new SlowStream({ maxWriteInterval: 10 })) // Force up streams to be paused
      .pipe(
        writeData((data) => {
          result += "_" + data;
        })
      )
      .on("finish", () => {
        assert.deepStrictEqual(result, "_andré_bruno_robert_john_henri");
        done();
      });
  });

  it("should propagate error", async () => {
    const stream = streamArray([
      compose(
        streamArray(["andré"]),
        transformData(() => {
          throw new Error("This is a stream error");
        })
      ),
    ]);

    try {
      await oleoduc(
        stream,
        flattenStream(),
        writeData(() => {
          //do nothing
        })
      );
      assert.fail();
    } catch (e) {
      assert.strictEqual(e.message, "This is a stream error");
    }
  });
});
