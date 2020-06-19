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

  it("should writeObject (parallel options)", async () => {
    let source = createStream();
    source.push(1);
    source.push(2);
    source.push(3);
    source.push(null);
    let acc = [];
    let start = Date.now();

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
        { parallel: 3 }
      )
    );

    let timeElapsed = start - acc.pop();
    //first and second chunks are run immediately, third is run 100ms later)
    assert.ok(timeElapsed < 200);
  });

  it("should writeObject and handle synchronous error", async () => {
    let source = createStream();
    source.push("generate an error");
    source.push(null);

    try {
      await oleoduc(
        source,
        writeObject(
          (data) => {
            throw new Error(data);
          },
          { parallel: 1 }
        )
      );
      assert.fail();
    } catch (e) {
      assert.strictEqual(e.message, "An error occurred when handling chunks");
    }
  });

  it("should writeObject and handle asynchronous error (first chunk)", async () => {
    let source = createStream();
    source.push("andré");
    source.push(null);

    try {
      await oleoduc(
        source,
        writeObject(() => {
          return Promise.reject(new Error("An error occurred"));
        })
      );
      assert.fail();
    } catch (e) {
      assert.strictEqual(e.message, "An error occurred when handling chunks");
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
            return new Promise((resolve, reject) => {
              if (data === 2) {
                reject(new Error("Async error"));
              } else {
                acc.push(data);
                resolve();
              }
            });
          },
          { parallel: 1 }
        )
      );
      assert.fail();
    } catch (e) {
      assert.strictEqual(e.message, "An error occurred when handling chunks");
      assert.deepStrictEqual(acc, [1]);
    }
  });
});
