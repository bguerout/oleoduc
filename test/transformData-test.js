const assert = require("assert");
const { Readable } = require("stream");
const { transformData, writeData } = require("../index");
const { delay } = require("./testUtils");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe(__filename, () => {
  it("should transformData", (done) => {
    let chunks = [];
    let source = createStream();
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
    let chunks = [];
    let source = createStream();
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

  it("should transformData and writeData (async + parallel)", (done) => {
    let chunks = [];
    let source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push("robert");
    source.push(null);

    source
      .pipe(
        transformData(
          async (data) => {
            return new Promise((resolve) => {
              resolve(data.substring(0, 1));
            });
          },
          { parallel: 2 }
        )
      )
      .pipe(
        writeData(
          (data) => {
            return delay(() => chunks.push(data), 10);
          },
          { parallel: 2 }
        )
      )
      .on("finish", () => {
        assert.deepStrictEqual(chunks, ["a", "b", "r"]);
        done();
      });
  });

  it("should transformData and handle synchronous error", (done) => {
    let source = createStream();
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
    let source = createStream();
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

  it("should transformData (parallel options)", (done) => {
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
        transformData(
          (number) => {
            return delay(() => ({ number, timestamp: Date.now() }), timeoutPerBatch);
          },
          { parallel: tasksPerBatch }
        )
      )
      .pipe(writeData((data) => acc.push(data)))
      .on("data", () => ({}))
      .on("error", () => {
        assert.fail();
        done();
      })
      .on("finish", () => {
        let timeElapsed = acc.find((r) => r.number === 6).timestamp - start;
        assert.ok(timeElapsed > 30); // 2 tasks per batch with 10ms of timeout
        done();
      });
  });
});