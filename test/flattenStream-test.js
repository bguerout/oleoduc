const assert = require("assert");
const { writeData, flattenStream } = require("../index");
const { createStream } = require("./testUtils");
const SlowStream = require("slow-stream"); // eslint-disable-line node/no-unpublished-require

describe("flattenStream", () => {
  it("can transform a chunk into a stream", (done) => {
    let result = "";
    let stream = createStream([createStream(["andré"]), createStream(["bruno"])]);

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
    let stream = createStream([
      createStream(["andré", "bruno", "robert"]), //fill the buffer
      createStream(["john"]),
      createStream(["henri"]),
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
});
