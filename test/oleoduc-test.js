const assert = require("assert");
const { Readable } = require("stream");
const { transformObject, multipipe, writeObject } = require("../index");
const { delay } = require("./testUtils");

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

    await multipipe(
      source,
      transformObject((data) => data.substring(0, 1)),
      writeObject((data) => chunks.push(data))
    );

    assert.deepStrictEqual(chunks, ["a", "b", "r"]);
  });

  it("can create oleoduc from streams (async)", async () => {
    let chunks = [];
    let source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push("robert");
    source.push(null);

    await multipipe(
      source,
      transformObject((data) => {
        return delay(() => data.substring(0, 1), 2);
      }),
      writeObject((data) => {
        return delay(() => chunks.push(data), 2);
      })
    );

    assert.deepStrictEqual(chunks, ["a", "b", "r"]);
  });

  it("can create oleoduc with nested oleoduc", async () => {
    let chunks = [];
    let source = createStream();
    let nested = multipipe(
      source,
      transformObject((d) => d.substring(0, 1))
    );

    source.push("first");
    source.push(null);

    await multipipe(
      nested,
      writeObject((d) => chunks.push(d))
    );
    assert.deepStrictEqual(chunks, ["f"]);
  });

  it("can pipe an oleoduc stream", (done) => {
    let chunks = [];
    let source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push("robert");
    source.push(null);

    multipipe(source)
      .pipe(transformObject((data) => data.substring(0, 1)))
      .pipe(writeObject((data) => chunks.push(data)))
      .on("finish", () => {
        assert.deepStrictEqual(chunks, ["a", "b", "r"]);
        done();
      });
  });

  it("oleoduc should propagate emitted error", (done) => {
    let source = createStream();

    multipipe(
      source,
      writeObject(() => ({}))
    )
      .then(() => {
        assert.fail();
        done();
      })
      .catch(() => {
        done();
      });

    source.push("first");
    source.emit("error", "emitted");
  });

  it("oleoduc should propagate thrown error", (done) => {
    let source = createStream();
    source.push("first");
    source.push(null);

    multipipe(
      source,
      writeObject(() => {
        throw new Error();
      })
    )
      .then(() => {
        assert.fail();
        done();
      })
      .catch(() => {
        done();
      });
  });
});
