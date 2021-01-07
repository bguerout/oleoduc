const assert = require("assert");
const { Readable } = require("stream");
const { csvStream, writeData } = require("../index");

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
      .pipe(csvStream())
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

  it("should transform object into a csv with custom columns and separator", (done) => {
    let source = createStream();
    source.push({ firstName: "Robert", lastName: "Hue" });
    source.push(null);

    let csv = [];
    source
      .pipe(
        csvStream({
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
});
