const assert = require("assert");
const { createStream } = require("./testUtils.js");
const { compose, transformData, writeData, oleoduc, flattenArray } = require("../index");
// eslint-disable-next-line node/no-unpublished-require
const SlowStream = require("slow-stream");

describe("compose", () => {
  it("can compose streams", (done) => {
    const chunks = [];
    const source = createStream();
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
    const chunks = [];
    const source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push("robert");
    source.push(null);

    const stream = compose(
      source,
      transformData((data) => data.substring(0, 1))
    );

    for await (const chunk of stream) {
      chunks.push(chunk);
    }

    assert.deepStrictEqual(chunks, ["a", "b", "r"]);
  });

  it("can pipe a compose stream", (done) => {
    const chunks = [];
    const source = createStream();
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

  it("can build compose with first writeable and last readable (duplex)", (done) => {
    const chunks = [];
    const source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push("robert");
    source.push(null);

    source
      .pipe(
        compose(
          transformData((data) => data.substring(0, 1)),
          transformData((data) => "_" + data)
        )
      )
      .pipe(writeData((data) => chunks.push(data)))
      .on("finish", () => {
        assert.deepStrictEqual(chunks, ["_a", "_b", "_r"]);
        done();
      });
  });

  it("can compose inside compose", (done) => {
    const chunks = [];
    const source = createStream();
    const nested = compose(
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

  it("can use oleoduc inside compose", (done) => {
    const chunks = [];
    const source = createStream();
    const nested = oleoduc(
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

  it("can handle back pressure", (done) => {
    let result = "";
    const source = createStream();
    source.push(["andré", "bruno", "robert"]);
    source.push(null);

    compose(
      source,
      flattenArray({ highWaterMark: 1 }),
      new SlowStream({ maxWriteInterval: 10 }),
      writeData((data) => {
        result += data;
      })
    ).on("finish", () => {
      assert.deepStrictEqual(result, "andrébrunorobert");
      done();
    });
  });

  it("can handle back pressure with nested compose", (done) => {
    let result = "";
    const source = createStream();
    source.push(["andré", "bruno", "robert"]);
    source.push(null);

    compose(
      source,
      compose(flattenArray({ highWaterMark: 1 }), new SlowStream({ maxWriteInterval: 10 })),
      writeData((data) => {
        result += data;
      })
    ).on("finish", () => {
      assert.deepStrictEqual(result, "andrébrunorobert");
      done();
    });
  });

  it("should propagate emitted error", (done) => {
    const source = createStream();

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
    const source = createStream();
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
