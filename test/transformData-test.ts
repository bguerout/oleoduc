import { deepStrictEqual, strictEqual, fail } from "assert";
import { createStream } from "./testUtils";
import { transformData, writeData } from "../src";

describe("transformData", () => {
  it("should transformData", (done) => {
    const chunks = [];
    const source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push(null);

    source
      .pipe(transformData((data) => data.substring(0, 1)))
      .pipe(writeData((data) => chunks.push(data)))
      .on("finish", () => {
        deepStrictEqual(chunks, ["a", "b"]);
        done();
      });
  });

  it("should transformData (async)", (done) => {
    const chunks = [];
    const source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push(null);

    source
      .pipe(
        transformData(async (data) => {
          return new Promise((resolve) => {
            resolve(data.substring(0, 1));
          });
        }),
      )
      .pipe(
        writeData(async (data) => {
          return new Promise<void>((resolve) => {
            chunks.push(data);
            resolve();
          });
        }),
      )
      .on("finish", () => {
        deepStrictEqual(chunks, ["a", "b"]);
        done();
      });
  });

  it("should transformData and handle synchronous error", (done) => {
    const source = createStream();
    source.push("andré");
    source.push(null);

    source
      .pipe(
        transformData(() => {
          throw new Error("An error occurred");
        }),
      )
      .on("data", () => ({}))
      .on("error", (e) => {
        strictEqual(e.message, "An error occurred");
        done();
      })
      .on("finish", () => {
        fail();
        done();
      });
  });

  it("should transformData and handle asynchronous error", (done) => {
    const source = createStream();
    source.push("andré");
    source.push(null);

    source
      .pipe(
        transformData(() => {
          return Promise.reject(new Error("An error occurred"));
        }),
      )
      .on("data", () => ({}))
      .on("error", (e) => {
        strictEqual(e.message, "An error occurred");
        done();
      })
      .on("finish", () => {
        fail();
        done();
      });
  });
});
