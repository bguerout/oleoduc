const assert = require("assert");
const { Readable } = require("stream");
const { filterData } = require("../index");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe("filterData", () => {
  it("should filter (ignore empty)", (done) => {
    const chunks = [];
    const source = createStream();
    source.push("first");
    source.push("");
    source.push(null);

    source
      .pipe(
        filterData((value) => {
          return value !== null && value !== undefined && Object.keys(value).length > 0;
        })
      )
      .on("data", (d) => chunks.push(d))
      .on("end", () => {
        assert.deepStrictEqual(chunks, ["first"]);
        done();
      });
  });

  it("should filter (async)", (done) => {
    const chunks = [];
    const source = createStream();
    source.push("first");
    source.push("");
    source.push(null);

    source
      .pipe(
        filterData(() => {
          return Promise.resolve(false);
        })
      )
      .on("data", (d) => chunks.push(d))
      .on("end", () => {
        assert.deepStrictEqual(chunks, []);
        done();
      });
  });

  it("should filter (ignore first line)", (done) => {
    const chunks = [];
    const source = createStream();
    source.push("first");
    source.push("second");
    source.push(null);

    let lines = 0;
    source
      .pipe(filterData(() => lines++ !== 0))
      .on("data", (d) => chunks.push(d))
      .on("end", () => {
        assert.deepStrictEqual(chunks, ["second"]);
        done();
      });
  });

  it("should filter with options", (done) => {
    const source = createStream();
    source.push({ object: true });
    source.push(null);

    source
      .pipe(filterData(() => true, { objectMode: false }))
      .on("error", (e) => {
        assert.strictEqual(e.message, "Invalid non-string/buffer chunk");
        done();
      })
      .on("end", () => {
        assert.fail();
      });
  });
});
