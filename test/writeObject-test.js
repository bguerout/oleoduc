const assert = require("assert");
const { Readable } = require("stream");
const { writeData } = require("../index");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe(__filename, () => {
  it("should writeData", (done) => {
    let source = createStream();
    source.push("andré");
    source.push(null);
    let acc = [];

    source
      .pipe(
        writeData((data) => {
          acc.push(data);
        })
      )
      .on("finish", () => {
        assert.deepStrictEqual(acc, ["andré"]);
        done();
      });
  });

  it("should writeData and handle synchronous error", (done) => {
    let source = createStream();
    source.push(1);
    source.push(null);

    source
      .pipe(
        writeData(
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

  it("should writeData and handle asynchronous error (first chunk)", (done) => {
    let source = createStream();
    source.push("andré");
    source.push(null);

    source
      .pipe(
        writeData(() => {
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

  it("should writeData and handle asynchronous error", (done) => {
    let source = createStream();
    source.push(1);
    source.push(2);
    source.push(3);
    source.push(null);
    let acc = [];

    source
      .pipe(
        writeData(
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
