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
  it("can create oleoduc", async () => {
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

  it("can create oleoduc with a nested oleoduc", async () => {
    let chunks = [];
    let source = createStream();
    let nested = oleoduc(
      source,
      transformData((d) => d.substring(0, 1))
    );

    source.push("first");
    source.push(null);

    try {
      await oleoduc(
        nested,
        writeData((d) => chunks.push(d))
      );
      assert.deepStrictEqual(chunks, ["f"]);
    } catch (e) {
      assert.fail(e);
    }
  });

  it("can create oleoduc with nested no promisified oleoduc", async () => {
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
      .catch((e) => {
        assert.fail(e);
      });
  });

  it("can create no promisified oleoduc with nested no promisified oleoduc", (done) => {
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
      .on("error", (e) => {
        assert.fail(e);
        done();
      });
  });

  it("can create no promisified oleoduc with nested oleoduc", (done) => {
    let chunks = [];
    let source = createStream();
    let nested = oleoduc(
      source,
      transformData((d) => d.substring(0, 1))
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

  it("can pipe oleoduc", async () => {
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

  it("can pipe no promisified oleoduc", (done) => {
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

  it("no promisified oleoduc should propagate emitted error", (done) => {
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

  it("no promisified oleoduc should propagate thrown error", (done) => {
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

  it("oleoduc should fail when no stream are provided", async () => {
    try {
      await oleoduc();
      assert.fail();
    } catch (e) {
      assert.strictEqual(e.message, "You must provide at least one stream");
    }
  });
});
