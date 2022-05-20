const assert = require("assert");
const { Readable } = require("stream");
const { transformIntoJSON } = require("../index");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe("transformIntoJSON", () => {
  it("can stream a json array", (done) => {
    const sourceStream = createStream();
    sourceStream.push({ name: "andré" });
    sourceStream.push({ name: "robert" });
    sourceStream.push(null);

    let json = "";
    sourceStream
      .pipe(transformIntoJSON())
      .on("data", (d) => {
        return (json += d);
      })
      .on("end", () => {
        assert.deepStrictEqual(JSON.parse(json), [{ name: "andré" }, { name: "robert" }]);
        done();
      });
  });

  it("can stream an empty json array", (done) => {
    const sourceStream = createStream();
    sourceStream.push(null);

    let json = "";
    sourceStream
      .pipe(transformIntoJSON())
      .on("data", (d) => {
        return (json += d);
      })
      .on("end", () => {
        assert.deepStrictEqual(JSON.parse(json), []);
        done();
      });
  });

  it("can wrap and stream a json array", (done) => {
    const sourceStream = createStream();
    sourceStream.push({ name: "andré" });
    sourceStream.push(null);

    let json = "";
    sourceStream
      .pipe(transformIntoJSON({ arrayPropertyName: "results" }))
      .on("data", (d) => {
        return (json += d);
      })
      .on("end", () => {
        assert.deepStrictEqual(JSON.parse(json), { results: [{ name: "andré" }] });
        done();
      });
  });

  it("can wrap and stream an empty json array", (done) => {
    const sourceStream = createStream();
    sourceStream.push(null);

    let json = "";
    sourceStream
      .pipe(transformIntoJSON({ arrayPropertyName: "results" }))
      .on("data", (d) => {
        return (json += d);
      })
      .on("end", () => {
        assert.deepStrictEqual(JSON.parse(json), { results: [] });
        done();
      });
  });

  it("can wrap and stream a json array into a object", (done) => {
    const sourceStream = createStream();
    sourceStream.push({ name: "andré" });
    sourceStream.push(null);

    let json = "";
    sourceStream
      .pipe(transformIntoJSON({ arrayWrapper: { preexisting: true }, arrayPropertyName: "results" }))
      .on("data", (d) => {
        return (json += d);
      })
      .on("end", () => {
        assert.deepStrictEqual(JSON.parse(json), { preexisting: true, results: [{ name: "andré" }] });
        done();
      });
  });

  it("can wrap and stream an empty json array into a object", (done) => {
    const sourceStream = createStream();
    sourceStream.push(null);

    let json = "";
    sourceStream
      .pipe(transformIntoJSON({ arrayWrapper: { preexisting: true }, arrayPropertyName: "results" }))
      .on("data", (d) => {
        return (json += d);
      })
      .on("end", () => {
        assert.deepStrictEqual(JSON.parse(json), { preexisting: true, results: [] });
        done();
      });
  });
});
