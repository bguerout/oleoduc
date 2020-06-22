const assert = require("assert");
const { Readable } = require("stream");
const { writeObject } = require("../index");
const { delay } = require("./testUtils");

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

  it("should writeObject (parallel options)", (done) => {
    let timeoutPerBatch = 10;
    let tasksPerBatch = 2;
    let acc = [];

    let start = Date.now();
    let source = createStream();
    //first
    source.push(1);
    source.push(2);
    //second
    source.push(3);
    source.push(4);
    //third
    source.push(5);
    source.push(6);

    source.push(null);

    source
      .pipe(
        writeObject(
          (number) => {
            return delay(() => acc.push({ number, timestamp: Date.now() }), timeoutPerBatch);
          },
          { parallel: tasksPerBatch }
        )
      )
      .on("finish", () => {
        let timeElapsed = acc.find((r) => r.number === 6).timestamp - start;
        assert.ok(timeElapsed > 30); // 2 tasks per batch with 10ms of timeout
        done();
      });
  });

  it("should writeObject and handle synchronous error", (done) => {
    let source = createStream();
    source.push(1);
    source.push(null);

    source
      .pipe(
        writeObject(
          () => {
            throw new Error("sync error");
          },
          { parallel: 1 }
        )
      )
      .on("error", (e) => {
        assert.strictEqual(e.message, "sync error");
        done();
      })
      .on("finish", () => {
        assert.fail();
        done();
      });
  });

  it("should writeObject and handle asynchronous error (first chunk)", (done) => {
    let source = createStream();
    source.push("andré");
    source.push(null);

    source
      .pipe(
        writeObject(() => {
          return Promise.reject(new Error("first chunk"));
        })
      )
      .on("error", (e) => {
        assert.strictEqual(e.message, "first chunk");
        done();
      })
      .on("finish", () => {
        assert.fail();
        done();
      });
  });

  it("should writeObject and handle asynchronous error", (done) => {
    let source = createStream();
    source.push(1);
    source.push(2);
    source.push(3);
    source.push(null);
    let acc = [];

    source
      .pipe(
        writeObject(
          (data) => {
            return new Promise((resolve, reject) => {
              if (data === 2) {
                reject(new Error("async error"));
              } else {
                acc.push(data);
                resolve();
              }
            });
          },
          { parallel: 1 }
        )
      )
      .on("error", (e) => {
        assert.strictEqual(e.message, "async error");
        assert.deepStrictEqual(acc, [1]);
        done();
      })
      .on("finish", () => {
        assert.fail();
        done();
      });
  });
});
