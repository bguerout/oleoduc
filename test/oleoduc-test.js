const assert = require("assert");
const { Readable } = require("stream");
const { transformObject, oleoduc, writeObject } = require("../index");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe(__filename, () => {
  it("can create oleoduc from streams", async () => {
    let chunks = [];
    let source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push("robert");
    source.push(null);

    await oleoduc(
      source,
      transformObject((data) => data.substring(0, 1)),
      writeObject((data) => chunks.push(data))
    );

    assert.deepStrictEqual(chunks, ["a", "b", "r"]);
  });

  it("can use oleoduc with combined streams", async () => {
    let chunks = [];
    let source = createStream();
    let combined = oleoduc(
      source,
      transformObject((d) => d.substring(0, 1))
    );

    source.push("first");
    source.push(null);

    await oleoduc(
      combined,
      writeObject((d) => chunks.push(d))
    );
    assert.deepStrictEqual(chunks, ["f"]);
  });

  it("can create oleoduc from streams (error propagation)", (done) => {
    let source = createStream();

    oleoduc(
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

  it("can create oleoduc from streams (error callback propagation)", async () => {
    let source = createStream();
    source.push("andré");

    try {
      await oleoduc(
        source,
        writeObject(() => {
          throw new Error("An error occurred");
        })
      );
      assert.fail();
    } catch (e) {
      assert.strictEqual(e.constructor.name, "WriteParallelError");
    }
  });

  it("can creat oleoduc to merge streams into a readable one", (done) => {
    let chunks = [];
    let source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push("robert");
    source.push(null);

    oleoduc(
      source,
      transformObject((data) => data.substring(0, 1))
    )
      .pipe(writeObject((data) => chunks.push(data)))
      .on("finish", () => {
        assert.deepStrictEqual(chunks, ["a", "b", "r"]);
        done();
      });
  });

  it("can create oleoduc from streams and then pipe", (done) => {
    let chunks = [];
    let source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push("robert");
    source.push(null);

    oleoduc(source)
      .pipe(transformObject((data) => data.substring(0, 1)))
      .pipe(writeObject((data) => chunks.push(data)))
      .on("finish", () => {
        assert.deepStrictEqual(chunks, ["a", "b", "r"]);
        done();
      });
  });

  it("Ensure error is propagated when combining stream", (done) => {
    let source = createStream();
    source.push("andré");

    oleoduc(
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

  it("Ensure error is propagated when combining stream (writeObject)", (done) => {
    let source = createStream();
    source.push("first");

    oleoduc(
      source,
      writeObject(() => {
        throw new Error("write");
      })
    )
      .on("error", (e) => {
        assert.strictEqual(e.constructor.name, "WriteParallelError");
        done();
      })
      .on("finish", () => {
        assert.fail();
        done();
      });
  });
});
