const assert = require("assert");
const { Readable } = require("stream");
const { compose, transformData, writeData, oleoduc } = require("../index");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe("compose", () => {
  it("can compose streams", (done) => {
    let chunks = [];
    let source = createStream();
    source.push("first");
    source.push(null);

    compose(
      source,
      transformData((d) => d.substring(0, 1)),
      writeData((data) => chunks.push(data))
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

  it("can iterate over a composed stream", async () => {
    let chunks = [];
    let source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push("robert");
    source.push(null);

    let stream = compose(
      source,
      transformData((data) => data.substring(0, 1))
    );

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    assert.deepStrictEqual(chunks, ["a", "b", "r"]);
  });

  it("can add nested composed stream into a compose", (done) => {
    let chunks = [];
    let source = createStream();
    let nested = compose(
      source,
      transformData((d) => d.substring(0, 1))
    );

    source.push("first");
    source.push(null);

    compose(
      nested,
      writeData((d) => chunks.push(d))
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

  it("can pipe composed stream", (done) => {
    let chunks = [];
    let source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push("robert");
    source.push(null);

    compose(source)
      .pipe(transformData((data) => data.substring(0, 1)))
      .pipe(writeData((data) => chunks.push(data)))
      .on("finish", () => {
        assert.deepStrictEqual(chunks, ["a", "b", "r"]);
        done();
      });
  });

  it("can add a nested oleoduc into compose", (done) => {
    let chunks = [];
    let source = createStream();
    let nested = oleoduc(
      source,
      transformData((d) => d.substring(0, 1))
    );

    source.push("first");
    source.push(null);

    compose(
      nested,
      writeData((d) => chunks.push(d))
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

  it("should propagate emitted error", (done) => {
    let source = createStream();

    compose(
      source,
      writeData(() => ({}))
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

  it("should propagate thrown error", (done) => {
    let source = createStream();
    source.push("first");
    source.push(null);

    compose(
      source,
      writeData(() => {
        throw new Error("write error");
      })
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
});
