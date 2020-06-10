const assert = require("assert");
const { Readable } = require("stream");
const { transformObject, pipeline, combine, writeObject } = require("../index");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe(__filename, () => {
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
});
