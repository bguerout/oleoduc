const assert = require("assert");
const { Readable } = require("stream");
const { writeObject } = require("../index");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe(__filename, () => {
  it("should writeObject", (done) => {
    let stream = createStream();
    stream.push("andré");
    stream.push(null);
    let acc = [];

    stream
      .pipe(
        writeObject((data) => {
          acc.push(data);
        })
      )
      .on("finish", () => {
        assert.deepStrictEqual(acc, ["andré"]);
        done();
      });
  });

  it("should writeObject and handle synchronous error", (done) => {
    let stream = createStream();
    stream.push("andré");
    stream.push(null);

    stream
      .pipe(
        writeObject(() => {
          throw new Error("An error occurred");
        })
      )
      .on("error", (e) => {
        assert.strictEqual(e.message, "An error occurred");
        done();
      })
      .on("finish", () => {
        assert.fail();
        done();
      });
  });

  it("should writeObject and handle asynchronous error", (done) => {
    let stream = createStream();
    stream.push("andré");
    stream.push(null);
    let errorHasBeenThrown = false;

    stream
      .pipe(
        writeObject(() => {
          return Promise.reject(new Error("An error occurred"));
        })
      )
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
