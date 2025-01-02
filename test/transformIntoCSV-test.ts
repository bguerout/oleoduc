import { deepStrictEqual, fail, strictEqual, ok } from "assert";
import { createStream, delay } from "./testUtils";
import { transformIntoCSV, writeData } from "../src";

type FullNameParams = { firstName: string; lastName: string };

describe("transformIntoCSV", () => {
  it("should transform object into a csv", (done) => {
    const source = createStream();
    source.push({ firstName: "Robert", lastName: "Hue" });
    source.push(null);

    const csv: string[] = [];
    source
      .pipe(transformIntoCSV())
      .pipe(
        writeData((line: string) => {
          csv.push(line);
        }),
      )
      .on("finish", () => {
        deepStrictEqual(csv, ["firstName;lastName\n", "Robert;Hue\n"]);
        done();
      });
  });

  it("should transform object with mapper", (done) => {
    const source = createStream();
    source.push({ firstName: "Robert", lastName: "Hue" });
    source.push(null);

    const csv: string[] = [];
    source
      .pipe(transformIntoCSV({ mapper: (v) => `"${v}"` }))
      .pipe(
        writeData((line: string) => {
          csv.push(line);
        }),
      )
      .on("finish", () => {
        deepStrictEqual(csv, ['"firstName";"lastName"\n', '"Robert";"Hue"\n']);
        done();
      });
  });

  it("should transform object into a csv with bom", (done) => {
    const source = createStream();
    source.push({ firstName: "Robert", lastName: "Hue" });
    source.push(null);

    const csv: string[] = [];
    source
      .pipe(transformIntoCSV({ bom: true }))
      .pipe(
        writeData((line: string) => {
          csv.push(line);
        }),
      )
      .on("finish", () => {
        ok(csv[0].startsWith("\ufeff"));
        done();
      });
  });

  it("should transform object into a csv with separator", (done) => {
    const source = createStream();
    source.push({ firstName: "Robert", lastName: "Hue" });
    source.push({ firstName: "John", lastName: "Doe" });
    source.push(null);

    const csv: string[] = [];
    source
      .pipe(
        transformIntoCSV({
          separator: "|",
        }),
      )
      .pipe(
        writeData((line: string) => {
          csv.push(line);
        }),
      )
      .on("finish", () => {
        deepStrictEqual(csv, ["firstName|lastName\n", "Robert|Hue\n", "John|Doe\n"]);
        done();
      });
  });

  it("should transform object into a csv with custom columns", (done) => {
    const source = createStream();
    source.push({ firstName: "Robert", lastName: "Hue" });
    source.push(null);

    const csv: string[] = [];
    source
      .pipe(
        transformIntoCSV({
          columns: {
            fullName: (data) => `${data.firstName} ${data.lastName}`,
          },
        }),
      )
      .pipe(
        writeData((line: string) => {
          csv.push(line);
        }),
      )
      .on("finish", () => {
        deepStrictEqual(csv, ["fullName\n", "Robert Hue\n"]);
        done();
      });
  });

  it("should transform object into a csv with async columns", (done) => {
    const source = createStream();
    source.push({ firstName: "Robert", lastName: "Hue" });
    source.push(null);

    const csv: string[] = [];
    source
      .pipe(
        transformIntoCSV({
          columns: {
            fullName: (data: FullNameParams) => Promise.resolve(`${data.firstName} ${data.lastName}`),
            lastName: async (data: FullNameParams) => await delay(() => data.lastName, 5),
          },
        }),
      )
      .pipe(
        writeData((line: string) => {
          csv.push(line);
        }),
      )
      .on("finish", () => {
        deepStrictEqual(csv, ["fullName;lastName\n", "Robert Hue;Hue\n"]);
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
        strictEqual(e.message, "Unable to handle data");
        done();
      })
      .on("finish", () => {
        fail();
        done();
      });
  });
});
