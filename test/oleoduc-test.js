const assert = require("assert");
const { Readable } = require("stream");
const { oleoduc, transformData, writeData } = require("../index");
const { delay } = require("./testUtils");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe(__filename, () => {
  it("can create oleoduc from stream ", async () => {
    let chunks = [];
    let source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push("robert");
    source.push(null);

    await oleoduc(
      source,
      transformData((data) => {
        return delay(() => data.substring(0, 1), 2);
      }),
      writeData((data) => {
        return delay(() => chunks.push(data), 2);
      })
    );

    assert.deepStrictEqual(chunks, ["a", "b", "r"]);
  });

  it("can create oleoduc with nested oleoduc", async () => {
    let chunks = [];
    let source = createStream();
    let nested = oleoduc(
      source,
      transformData((d) => d.substring(0, 1))
    );

    source.push("first");
    source.push(null);

    await oleoduc(
      nested,
      writeData((d) => chunks.push(d))
    )
      .then(() => {
        assert.deepStrictEqual(chunks, ["f"]);
      })
      .catch(() => {
        assert.fail();
      });
  });

  it("can create oleoduc with no promisified oleoduc", async () => {
    let chunks = [];
    let source = createStream();
    let nested = oleoduc(
      source,
      transformData((d) => d.substring(0, 1)),
      { promisify: false }
    );

    source.push("first");
    source.push(null);

    await oleoduc(
      nested,
      writeData((d) => chunks.push(d))
    )
      .then(() => {
        assert.deepStrictEqual(chunks, ["f"]);
      })
      .catch(() => {
        assert.fail();
      });
  });

  it("oleoduc should propagate emitted error", (done) => {
    let source = createStream();

    oleoduc(
      source,
      writeData(() => ({}))
    )
      .then(() => {
        assert.fail();
        done();
      })
      .catch((e) => {
        assert.deepStrictEqual(e, "emitted");
        done();
      });

    source.push("first");
    source.emit("error", "emitted");
  });

  it("oleoduc should propagate thrown error", async () => {
    let source = createStream();
    source.push("first");
    source.push(null);

    await oleoduc(
      source,
      writeData(() => {
        throw new Error("write error");
      })
    )
      .then(() => {
        assert.fail();
      })
      .catch((e) => {
        assert.deepStrictEqual(e.message, "write error");
      });
  });

  it("can pipe a oleoduc ", async () => {
    let chunks = [];
    let source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push("robert");
    source.push(null);

    await oleoduc(source)
      .pipe(transformData((data) => data.substring(0, 1)))
      .pipe(writeData((data) => chunks.push(data)))
      .on("finish", () => {
        assert.deepStrictEqual(chunks, ["a", "b", "r"]);
      });
  });

  it("can create oleoduc (promisify:false)", (done) => {
    let chunks = [];
    let source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push("robert");
    source.push(null);

    oleoduc(
      source,
      transformData((data) => data.substring(0, 1)),
      writeData((data) => chunks.push(data)),
      { promisify: false }
    )
      .on("finish", () => {
        assert.deepStrictEqual(chunks, ["a", "b", "r"]);
        done();
      })
      .on("error", () => {
        assert.fail();
        done();
      });
  });

  it("oleoduc should propagate emitted error (promisify:false)", (done) => {
    let source = createStream();

    oleoduc(
      source,
      writeData(() => ({})),
      { promisify: false }
    )
      .on("finish", () => {
        assert.fail();
        done();
      })
      .on("error", (e) => {
        assert.deepStrictEqual(e, "emitted");
        done();
      });

    source.push("first");
    source.emit("error", "emitted");
  });

  it("oleoduc should propagate thrown error (promisify:false)", (done) => {
    let source = createStream();
    source.push("first");
    source.push(null);

    oleoduc(
      source,
      writeData(() => {
        throw new Error("write error");
      }),
      { promisify: false }
    )
      .on("finish", () => {
        assert.fail();
        done();
      })
      .on("error", (e) => {
        assert.deepStrictEqual(e.message, "write error");
        done();
      });
  });

  it("can create oleoduc with nested oleoduc (promisify:false)", (done) => {
    let chunks = [];
    let source = createStream();
    let nested = oleoduc(
      source,
      transformData((d) => d.substring(0, 1)),
      { promisify: false }
    );

    source.push("first");
    source.push(null);

    oleoduc(
      nested,
      writeData((d) => chunks.push(d)),
      { promisify: false }
    )
      .on("finish", () => {
        assert.deepStrictEqual(chunks, ["f"]);
        done();
      })
      .on("error", () => {
        assert.fail();
        done();
      });
  });

  it("can pipe a oleoduc (promisify:false)", (done) => {
    let chunks = [];
    let source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push("robert");
    source.push(null);

    oleoduc(source, { promisify: false })
      .pipe(transformData((data) => data.substring(0, 1)))
      .pipe(writeData((data) => chunks.push(data)))
      .on("finish", () => {
        assert.deepStrictEqual(chunks, ["a", "b", "r"]);
        done();
      });
  });
});
