const assert = require("assert");
const { Readable } = require("stream");
const { writeObject, oleoduc } = require("../index");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe(__filename, () => {
  it("should writeObject", (done) => {
    let source = createStream();
    source.push("andré");
    source.push(null);
    let acc = [];

    source
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

  it("should writeObject with parallel", async () => {
    let source = createStream();
    source.push(1);
    source.push(2);
    source.push(3);
    source.push(null);
    let acc = [];
    let start = Date.now();

    try {
      await oleoduc(
        source,
        writeObject(
          () => {
            return new Promise((resolve) => {
              setTimeout(() => {
                acc.push(Date.now());
                resolve();
              }, 250);
            });
          },
          { parallel: 2 }
        )
      );
    } catch (e) {
      let timeElapsed = start - acc.pop();
      //first and second chunks are run immediately, third is run 100ms later)
      assert.ok(timeElapsed < 200);
    }
  });

  it("should writeObject with parallel and preserve order", async () => {
    let source = createStream();
    source.push(1);
    source.push(2);
    source.push(3);
    source.push(null);
    let acc = [];

    try {
      await oleoduc(
        source,
        writeObject(
          (data) => {
            return acc.push(data);
          },
          { parallel: 2 }
        )
      );
    } catch (e) {
      assert.deepStrictEqual(acc, [1, 2, 3]);
    }
  });

  it("should writeObject and handle synchronous error", async () => {
    let source = createStream();
    source.push("andré");
    source.push(null);

    try {
      await oleoduc(
        source,
        writeObject(
          () => {
            throw new Error("An error occurred");
          },
          { parallel: 1 }
        )
      );
    } catch (e) {
      assert.strictEqual(e.errors.length, 1);
      assert.strictEqual(e.constructor.name, "WriteParallelError");
    }
  });

  it("should writeObject and handle asynchronous error (first chunk)", async () => {
    let source = createStream();
    source.push("andré");
    source.push(null);

    try {
      await oleoduc(
        source,
        writeObject(
          () => {
            return Promise.reject(new Error("An error occurred"));
          },
          { parallel: 1 }
        )
      );
    } catch (e) {
      assert.strictEqual(e.errors.length, 1);
      assert.strictEqual(e.constructor.name, "WriteParallelError");
    }
  });

  it("should writeObject and handle asynchronous error", async () => {
    let source = createStream();
    source.push(1);
    source.push(2);
    source.push(3);
    source.push(null);
    let acc = [];

    try {
      await oleoduc(
        source,
        writeObject(
          (data) => {
            if (data === 2) {
              throw new Error("An error occurred");
            } else {
              acc.push(data);
            }
          },
          { parallel: 1 }
        )
      );
    } catch (e) {
      assert.strictEqual(e.errors.length, 1);
      assert.strictEqual(e.constructor.name, "WriteParallelError");
      assert.deepStrictEqual(acc, [1]);
    }
  });
});
