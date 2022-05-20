const assert = require("assert");
const { Readable } = require("stream");
const { transformData, writeData } = require("../index");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe("transformData", () => {
  it("should transformData", (done) => {
    const chunks = [];
    const source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push(null);

    source
      .pipe(transformData((data) => data.substring(0, 1)))
      .pipe(writeData((data) => chunks.push(data)))
      .on("finish", () => {
        assert.deepStrictEqual(chunks, ["a", "b"]);
        done();
      });
  });

  it("should transformData (async)", (done) => {
    const chunks = [];
    const source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push(null);

    source
      .pipe(
        transformData(async (data) => {
          return new Promise((resolve) => {
            resolve(data.substring(0, 1));
          });
        })
      )
      .pipe(
        writeData(async (data) => {
          return new Promise((resolve) => {
            chunks.push(data);
            resolve();
          });
        })
      )
      .on("finish", () => {
        assert.deepStrictEqual(chunks, ["a", "b"]);
        done();
      });
  });

  it("should transformData and handle synchronous error", (done) => {
    const source = createStream();
    source.push("andré");
    source.push(null);

    source
      .pipe(
        transformData(() => {
          throw new Error("An error occurred");
        })
      )
      .on("data", () => ({}))
      .on("error", (e) => {
        assert.strictEqual(e.message, "An error occurred");
        done();
      })
      .on("finish", () => {
        assert.fail();
        done();
      });
  });

  it("should transformData and handle asynchronous error", (done) => {
    const source = createStream();
    source.push("andré");
    source.push(null);

    source
      .pipe(
        transformData(() => {
          return Promise.reject(new Error("An error occurred"));
        })
      )
      .on("data", () => ({}))
      .on("error", (e) => {
        assert.strictEqual(e.message, "An error occurred");
        done();
      })
      .on("finish", () => {
        assert.fail();
        done();
      });
  });
});
