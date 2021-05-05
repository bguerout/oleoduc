const assert = require("assert");
const { Readable } = require("stream");
const { transformIntoCSV, writeData } = require("../index");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe(__filename, () => {
  it("should transform object into a csv", (done) => {
    let source = createStream();
    source.push({ firstName: "Robert", lastName: "Hue" });
    source.push(null);

    let csv = [];
    source
      .pipe(transformIntoCSV())
      .pipe(
        writeData((line) => {
          csv.push(line);
        })
      )
      .on("finish", () => {
        assert.deepStrictEqual(csv, ["firstName;lastName\n", "Robert;Hue\n"]);
        done();
      });
  });

  it("should transform object with mapper", (done) => {
    let source = createStream();
    source.push({ firstName: "Robert", lastName: "Hue" });
    source.push(null);

    let csv = [];
    source
      .pipe(transformIntoCSV({ mapper: (v) => `"${v}"` }))
      .pipe(
        writeData((line) => {
          csv.push(line);
        })
      )
      .on("finish", () => {
        assert.deepStrictEqual(csv, ['"firstName";"lastName"\n', '"Robert";"Hue"\n']);
        done();
      });
  });

  it("should transform object into a csv with bom", (done) => {
    let source = createStream();
    source.push({ firstName: "Robert", lastName: "Hue" });
    source.push(null);

    let csv = [];
    source
      .pipe(transformIntoCSV({ bom: true }))
      .pipe(
        writeData((line) => {
          csv.push(line);
        })
      )
      .on("finish", () => {
        assert.ok(csv[0].startsWith("\ufeff"));
        done();
      });
  });

  it("should transform object into a csv with custom columns and separator", (done) => {
    let source = createStream();
    source.push({ firstName: "Robert", lastName: "Hue" });
    source.push(null);

    let csv = [];
    source
      .pipe(
        transformIntoCSV({
          sepatator: "|",
          columns: {
            name: (data) => `${data.firstName} ${data.lastName}`,
          },
        })
      )
      .pipe(
        writeData((line) => {
          csv.push(line);
        })
      )
      .on("finish", () => {
        assert.deepStrictEqual(csv, ["name\n", "Robert Hue\n"]);
        done();
      });
  });

  it("should catch error in transformIntoCSV", (done) => {
    let result = [];
    let source = createStream();
    source.push("a");
    source.push(null);

    let transformer = transformIntoCSV({
      sepatator: "|",
      columns: {
        name() {
          throw new Error("Unable to hande data");
        },
      },
    });

    transformer.on("error", (e) => {
      assert.strictEqual(e.message, "Unable to hande data");
      done();
    });

    source
      .pipe(transformer)
      .pipe(writeData((data) => result.push(data)))
      .on("finish", () => {
        assert.fail();
        done();
      });
  });
});
