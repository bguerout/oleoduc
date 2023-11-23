import { deepStrictEqual, fail, ok } from "assert";
import { createStream, delay } from "./testUtils";
import { filterData, transformData, writeData } from "../src";

describe("parallel", () => {
  it("can run parallel task with order preserved", (done) => {
    const chunks = [];
    const source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push("robert");
    source.push(null);

    source
      .pipe(
        transformData(
          async (data) => {
            return new Promise((resolve) => {
              resolve(data.substring(0, 1));
            });
          },
          { parallel: 2 },
        ),
      )
      .pipe(
        writeData(
          (data) => {
            return delay(() => chunks.push(data), 10);
          },
          { parallel: 5 },
        ),
      )
      .on("finish", () => {
        deepStrictEqual(chunks, ["a", "b", "r"]);
        done();
      });
  });

  it("can transformData (parallel)", (done) => {
    const timeoutPerBatch = 10;
    const nbParallelTasks = 2;
    const acc = [];

    const source = createStream();
    //first batch
    source.push(1);
    source.push(2);
    //second
    source.push(3);
    source.push(4);
    //third
    source.push(5);
    source.push(6);

    source.push(null);

    const start = Date.now();
    source
      .pipe(
        transformData(
          (number) => {
            return delay(() => ({ number, timestamp: Date.now() }), timeoutPerBatch);
          },
          { parallel: nbParallelTasks },
        ),
      )
      .pipe(writeData((data) => acc.push(data)))
      .on("error", () => {
        fail();
        done();
      })
      .on("finish", () => {
        deepStrictEqual(
          acc.map((v) => v.number),
          [1, 2, 3, 4, 5, 6],
        );

        // 2 tasks per batch with 10ms of timeout
        const timeElapsed = acc[acc.length - 1].timestamp - start;
        ok(timeElapsed < 60);
        ok(timeElapsed > 29);
        done();
      });
  });

  it("can filterData (parallel)", (done) => {
    const timeoutPerBatch = 10;
    const nbParallelTasks = 2;
    const acc = [];

    const source = createStream();
    //first batch
    source.push(1);
    source.push(2);
    //second
    source.push(3);
    source.push(4);
    //third
    source.push(5);
    source.push(6);

    source.push(null);

    const start = Date.now();
    let last;
    source
      .pipe(
        filterData(
          (number) => {
            return delay(() => {
              last = Date.now();
              return number < 5;
            }, timeoutPerBatch);
          },
          { parallel: nbParallelTasks },
        ),
      )
      .pipe(
        transformData((number) => {
          return { number, timestamp: Date.now() };
        }),
      )
      .pipe(writeData((data) => acc.push(data)))
      .on("error", () => {
        fail();
        done();
      })
      .on("finish", () => {
        deepStrictEqual(
          acc.map((v) => v.number),
          [1, 2, 3, 4],
        );

        // 2 tasks per batch with 10ms of timeout
        const timeElapsed = last - start;
        ok(timeElapsed < 60);
        ok(timeElapsed > 29);
        done();
      });
  });

  it("can writeData (parallel)", (done) => {
    const timeoutPerBatch = 10;
    const nbParallelTasks = 2;
    const acc = [];

    const source = createStream();
    //first batch
    source.push(1);
    source.push(2);
    //second
    source.push(3);
    source.push(4);
    //third
    source.push(5);
    source.push(6);

    source.push(null);

    const start = Date.now();
    source
      .pipe(
        writeData(
          (number) => {
            return delay(() => acc.push({ number, timestamp: Date.now() }), timeoutPerBatch);
          },
          { parallel: nbParallelTasks },
        ),
      )
      .on("finish", () => {
        deepStrictEqual(
          acc.map((v) => v.number),
          [1, 2, 3, 4, 5, 6],
        );

        // 2 tasks per batch with 10ms of timeout
        const timeElapsed = acc[acc.length - 1].timestamp - start;
        ok(timeElapsed < 60);
        ok(timeElapsed >= 29);
        done();
      });
  });
});
