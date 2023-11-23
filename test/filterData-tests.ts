import { deepStrictEqual, fail, strictEqual } from "assert";
import { createStream } from "./testUtils";
import { filterData } from "../src";

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
        }),
      )
      .on("data", (d) => chunks.push(d))
      .on("end", () => {
        deepStrictEqual(chunks, ["first"]);
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
        }),
      )
      .on("data", (d) => chunks.push(d))
      .on("end", () => {
        deepStrictEqual(chunks, []);
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
        deepStrictEqual(chunks, ["second"]);
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
        strictEqual(e.message, "Invalid non-string/buffer chunk");
        done();
      })
      .on("end", () => {
        fail();
      });
  });
});
