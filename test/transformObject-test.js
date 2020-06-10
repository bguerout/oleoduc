const assert = require("assert");
const { Readable } = require("stream");
const { transformObject, writeObject } = require("../index");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe(__filename, () => {
  it("should transformObject", (done) => {
    let chunks = [];
    let stream = createStream();
    stream.push("andré");
    stream.push("bruno");
    stream.push(null);

    stream
      .pipe(transformObject((data) => data.substring(0, 1)))
      .pipe(writeObject((data) => chunks.push(data)))
      .on("finish", () => {
        assert.deepStrictEqual(chunks, ["a", "b"]);
        done();
      });
  });

  it("should transformObject (async)", (done) => {
    let chunks = [];
    let stream = createStream();
    stream.push("andré");
    stream.push("bruno");
    stream.push(null);

    stream
      .pipe(
        transformObject(async (data) => {
          return new Promise((resolve) => {
            resolve(data.substring(0, 1));
          });
        })
      )
      .pipe(
        writeObject(async (data) => {
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

  it("should transformObject and writeObject (async + parallel)", (done) => {
    let chunks = [];
    let stream = createStream();
    stream.push("andré");
    stream.push("bruno");
    stream.push("robert");
    stream.push(null);

    stream
      .pipe(
        transformObject(
          async (data) => {
            return new Promise((resolve) => {
              resolve(data.substring(0, 1));
            });
          },
          { parallel: 2 }
        )
      )
      .pipe(
        writeObject(
          (data) => {
            return new Promise((resolve) => {
              chunks.push(data);
              return setTimeout(() => resolve(), 10);
            });
          },
          { parallel: 2 }
        )
      )
      .on("finish", () => {
        assert.deepStrictEqual(chunks, ["a", "b", "r"]);
        done();
      });
  });

  it("should transformObject and handle synchronous error", (done) => {
    let stream = createStream();
    stream.push("andré");
    stream.push(null);

    stream
      .pipe(
        transformObject(() => {
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

  it("should transformObject and handle asynchronous error", (done) => {
    let stream = createStream();
    stream.push("andré");
    stream.push(null);
    let errorHasBeenThrown = false;

    stream
      .pipe(
        transformObject(() => {
          return Promise.reject(new Error("An error occurred"));
        })
      )
      .on("data", () => ({}))
      .on("error", (e) => {
        assert.strictEqual(e.message, "An error occurred");
        errorHasBeenThrown = true;
      })
      .on("finish", () => {
        assert.strictEqual(errorHasBeenThrown, true);
        done();
      });
  });
});
