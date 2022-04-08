const assert = require("assert");
const { Readable } = require("stream");
const { oleoduc, transformData, writeData, compose } = require("../index");
const { delay } = require("./testUtils");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe("oleoduc", () => {
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

  it("can iterate over an oleoduc", async () => {
    let chunks = [];
    let source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push("robert");
    source.push(null);

    let stream = oleoduc(
      source,
      transformData((data) => data.substring(0, 1))
    );

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

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

  it("can create oleoduc with a nested composed stream", async () => {
    let chunks = [];
    let source = createStream();
    let composed = compose(
      source,
      transformData((d) => d.substring(0, 1))
    );

    source.push("first");
    source.push(null);

    await oleoduc(
      composed,
      writeData((d) => chunks.push(d))
    )
      .then(() => {
        assert.deepStrictEqual(chunks, ["f"]);
      })
      .catch((e) => {
        assert.fail(e);
      });
  });

  it("can pipe and oleoduc", async () => {
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

  it("should propagate emitted error", (done) => {
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

  it("should propagate thrown error", async () => {
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

  it("should fail when no stream are provided", async () => {
    try {
      await oleoduc();
      assert.fail();
    } catch (e) {
      assert.strictEqual(e.message, "You must provide at least one stream");
    }
  });
});
