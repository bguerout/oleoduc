const assert = require("assert");
const { Readable } = require("stream");
const { multiStream, oleoduc, transformData, writeData } = require("../index");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe(__filename, () => {
  it("multiStream should propagate emitted error", (done) => {
    let source = createStream();

    multiStream(
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

  it("multiStream should propagate thrown error", (done) => {
    let source = createStream();
    source.push("first");
    source.push(null);

    multiStream(
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

  it("can create multiStream with nested multiStream", (done) => {
    let chunks = [];
    let source = createStream();
    let nested = multiStream(
      source,
      transformData((d) => d.substring(0, 1))
    );

    source.push("first");
    source.push(null);

    multiStream(
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

  it("can create multiStream with nested oleoduc", (done) => {
    let chunks = [];
    let source = createStream();
    let nested = oleoduc(
      source,
      transformData((d) => d.substring(0, 1))
    );

    source.push("first");
    source.push(null);

    multiStream(
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

  it("can pipe multiStream", (done) => {
    let chunks = [];
    let source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push("robert");
    source.push(null);

    multiStream(source)
      .pipe(transformData((data) => data.substring(0, 1)))
      .pipe(writeData((data) => chunks.push(data)))
      .on("finish", () => {
        assert.deepStrictEqual(chunks, ["a", "b", "r"]);
        done();
      });
  });
});
