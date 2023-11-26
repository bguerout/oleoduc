import assert from "assert";
import { createStream, delay } from "./testUtils.mjs";
import { transformIntoCSV, writeData } from "../index.mjs";

describe("transformIntoCSV", () => {
  it("should transform object into a csv", (done) => {
    const source = createStream();
    source.push({ firstName: "Robert", lastName: "Hue" });
    source.push(null);

    const csv = [];
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
    const source = createStream();
    source.push({ firstName: "Robert", lastName: "Hue" });
    source.push(null);

    const csv = [];
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
    const source = createStream();
    source.push({ firstName: "Robert", lastName: "Hue" });
    source.push(null);

    const csv = [];
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

  it("should transform object into a csv with separator", (done) => {
    const source = createStream();
    source.push({ firstName: "Robert", lastName: "Hue" });
    source.push({ firstName: "John", lastName: "Doe" });
    source.push(null);

    const csv = [];
    source
      .pipe(
        transformIntoCSV({
          separator: "|",
        })
      )
      .pipe(
        writeData((line) => {
          csv.push(line);
        })
      )
      .on("finish", () => {
        assert.deepStrictEqual(csv, ["firstName|lastName\n", "Robert|Hue\n", "John|Doe\n"]);
        done();
      });
  });

  it("should transform object into a csv with custom columns", (done) => {
    const source = createStream();
    source.push({ firstName: "Robert", lastName: "Hue" });
    source.push(null);

    const csv = [];
    source
      .pipe(
        transformIntoCSV({
          columns: {
            fullName: (data) => `${data.firstName} ${data.lastName}`,
          },
        })
      )
      .pipe(
        writeData((line) => {
          csv.push(line);
        })
      )
      .on("finish", () => {
        assert.deepStrictEqual(csv, ["fullName\n", "Robert Hue\n"]);
        done();
      });
  });

  it("should transform object into a csv with async columns", (done) => {
    const source = createStream();
    source.push({ firstName: "Robert", lastName: "Hue" });
    source.push(null);

    const csv = [];
    source
      .pipe(
        transformIntoCSV({
          columns: {
            fullName: (data) => Promise.resolve(`${data.firstName} ${data.lastName}`),
            lastName: async (data) => await delay(() => data.lastName, 5),
          },
        })
      )
      .pipe(
        writeData((line) => {
          csv.push(line);
        })
      )
      .on("finish", () => {
        assert.deepStrictEqual(csv, ["fullName;lastName\n", "Robert Hue;Hue\n"]);
        done();
      });
  });

  it("should catch error in transformIntoCSV", (done) => {
    const source = createStream();
    source.push("a");
    source.push(null);

    const transformer = transformIntoCSV({
      columns: {
        error() {
          throw new Error("Unable to handle data");
        },
      },
    });

    source
      .pipe(transformer)
      .on("data", () => ({}))
      .on("error", (e) => {
        assert.strictEqual(e.message, "Unable to handle data");
        done();
      })
      .on("finish", () => {
        assert.fail();
        done();
      });
  });
});
