const assert = require("assert");
const { Readable } = require("stream");
const { transformObject, ignoreEmpty, pipeline, combine, writeObject } = require("../index");

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

  it("can combine streams into a readable one", (done) => {
    let chunks = [];
    let source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push("robert");
    source.push(null);

    combine(
      source,
      transformObject((data) => data.substring(0, 1))
    )
      .pipe(writeObject((data) => chunks.push(data)))
      .on("finish", () => {
        assert.deepStrictEqual(chunks, ["a", "b", "r"]);
        done();
      });
  });

  it("can combine streams and then pipe", (done) => {
    let chunks = [];
    let source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push("robert");
    source.push(null);

    combine(source)
      .pipe(transformObject((data) => data.substring(0, 1)))
      .pipe(writeObject((data) => chunks.push(data)))
      .on("finish", () => {
        assert.deepStrictEqual(chunks, ["a", "b", "r"]);
        done();
      });
  });

  it("can combine streams (error propagation)", (done) => {
    let source = createStream();
    source.push("andré");

    combine(
      source,
      writeObject(() => ({}))
    )
      .on("error", (e) => {
        assert.strictEqual(e, "Error from source");
        done();
      })
      .on("finish", () => {
        assert.fail();
        done();
      });

    source.emit("error", "Error from source");
  });

  it("can combine streams (error propagation with promise)", (done) => {
    let source = createStream();

    combine(
      source,
      writeObject(() => ({}))
    )
      .then(() => {
        assert.fail();
        done();
      })
      .catch((e) => {
        assert.strictEqual(e, "emitted");
        done();
      });

    source.emit("error", "emitted");
  });

  it("can combine streams (error propagation from a nested stream)", (done) => {
    let source = createStream();
    source.push("first");

    combine(
      source,
      writeObject(() => {
        throw new Error("write");
      })
    )
      .on("error", (e) => {
        assert.strictEqual(e.message, "write");
        done();
      })
      .on("finish", () => {
        assert.fail();
        done();
      });
  });

  it("can pipeline streams", async () => {
    let chunks = [];
    let source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push("robert");
    source.push(null);

    await pipeline(
      source,
      transformObject((data) => data.substring(0, 1)),
      writeObject((data) => chunks.push(data))
    );

    assert.deepStrictEqual(chunks, ["a", "b", "r"]);
  });

  it("can use pipeline with combined streams", async () => {
    let chunks = [];
    let source = createStream();
    let combined = combine(
      source,
      transformObject((d) => d.substring(0, 1))
    );

    source.push("first");
    source.push(null);

    await pipeline(
      combined,
      writeObject((d) => chunks.push(d))
    );
    assert.deepStrictEqual(chunks, ["f"]);
  });

  it("can pipeline streams (error propagation)", (done) => {
    let source = createStream();

    pipeline(
      source,
      writeObject(() => ({}))
    )
      .then(() => {
        assert.fail();
        done();
      })
      .catch((e) => {
        assert.strictEqual(e, "emitted");
        done();
      });

    source.push("first");
    source.emit("error", "emitted");
  });

  it("can pipeline streams (error callback propagation)", async () => {
    let source = createStream();
    let promise = pipeline(
      source,
      writeObject(() => {
        throw new Error("An error occurred");
      })
    );

    try {
      source.push("andré");

      await promise;
      assert.fail();
    } catch (e) {
      assert.strictEqual(e.message, "An error occurred");
    }
  });

  it("should ignoreEmpty", (done) => {
    let chunks = [];
    let source = createStream();
    source.push("first");
    source.push("");
    source.push(null);

    source
      .pipe(ignoreEmpty())
      .on("data", (d) => chunks.push(d))
      .on("end", () => {
        assert.deepStrictEqual(chunks, ["first"]);
        done();
      });
  });
});
