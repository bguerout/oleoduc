const assert = require("assert");
const { streamArray, createStream, delay } = require("./testUtils.js");
const { writeData } = require("../index.js");
const { transformStream } = require("../lib/transformStream.js");
const SlowStream = require("slow-stream"); // eslint-disable-line node/no-unpublished-require

describe("transformStream", () => {
  it("should transform data into a stream", (done) => {
    const chunks = [];
    const source = streamArray(["andré", "bruno"]);

    source
      .pipe(
        transformStream((data) => {
          const source = createStream();
          source.push(data + "_transformed");
          source.push(null);
          return source;
        })
      )
      .pipe(
        writeData((data) => {
          return chunks.push(data);
        })
      )
      .on("finish", () => {
        assert.deepStrictEqual(chunks, ["andré_transformed", "bruno_transformed"]);
        done();
      });
  });

  it("should transform data into a stream (async)", (done) => {
    const chunks = [];
    const source = streamArray(["andré", "bruno"]);

    source
      .pipe(
        transformStream((data) => {
          const source = createStream();

          return delay(() => {
            source.push(data + "_transformed");
            source.push(null);
            return source;
          }, 20);
        })
      )
      .pipe(
        writeData((data) => {
          return chunks.push(data);
        })
      )
      .on("finish", () => {
        assert.deepStrictEqual(chunks, ["andré_transformed", "bruno_transformed"]);
        done();
      });
  });

  it("should transform data into a stream (backpressure)", (done) => {
    const chunks = [];
    const source = streamArray(["andré"]);

    source
      .pipe(
        transformStream(
          async (data) => {
            const source = createStream();
            for (let i = 0; i < 5; i++) {
              source.push(data + "_transformed");
            }
            source.push(null);
            return source;
          },
          { objectMode: true, highWaterMark: 1 }
        )
      )
      .pipe(new SlowStream({ maxWriteInterval: 10 })) // Force up streams to be paused
      .pipe(
        writeData((data) => {
          return chunks.push(data);
        })
      )
      .on("finish", () => {
        assert.deepStrictEqual(chunks, [
          "andré_transformed",
          "andré_transformed",
          "andré_transformed",
          "andré_transformed",
          "andré_transformed",
        ]);
        done();
      });
  });
});
