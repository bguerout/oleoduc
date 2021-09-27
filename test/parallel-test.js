const assert = require("assert");
const { Readable } = require("stream");
const { transformData, writeData, filterData } = require("../index");
const { delay } = require("./testUtils");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe("parallel", () => {
  it("can run parallel task with order preserved", (done) => {
    let chunks = [];
    let source = createStream();
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
          { parallel: 2 }
        )
      )
      .pipe(
        writeData(
          (data) => {
            return delay(() => chunks.push(data), 10);
          },
          { parallel: 5 }
        )
      )
      .on("finish", () => {
        assert.deepStrictEqual(chunks, ["a", "b", "r"]);
        done();
      });
  });

  it("can transformData (parallel)", (done) => {
    let timeoutPerBatch = 10;
    let nbParallelTasks = 2;
    let acc = [];

    let source = createStream();
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

    let start = Date.now();
    source
      .pipe(
        transformData(
          (number) => {
            return delay(() => ({ number, timestamp: Date.now() }), timeoutPerBatch);
          },
          { parallel: nbParallelTasks }
        )
      )
      .pipe(writeData((data) => acc.push(data)))
      .on("error", () => {
        assert.fail();
        done();
      })
      .on("finish", () => {
        assert.deepStrictEqual(
          acc.map((v) => v.number),
          [1, 2, 3, 4, 5, 6]
        );

        // 2 tasks per batch with 10ms of timeout
        let timeElapsed = acc[acc.length - 1].timestamp - start;
        assert.ok(timeElapsed < 60);
        assert.ok(timeElapsed > 29);
        done();
      });
  });

  it("can filterData (parallel)", (done) => {
    let timeoutPerBatch = 10;
    let nbParallelTasks = 2;
    let acc = [];

    let source = createStream();
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

    let start = Date.now();
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
          { parallel: nbParallelTasks }
        )
      )
      .pipe(
        transformData((number) => {
          return { number, timestamp: Date.now() };
        })
      )
      .pipe(writeData((data) => acc.push(data)))
      .on("error", () => {
        assert.fail();
        done();
      })
      .on("finish", () => {
        assert.deepStrictEqual(
          acc.map((v) => v.number),
          [1, 2, 3, 4]
        );

        // 2 tasks per batch with 10ms of timeout
        let timeElapsed = last - start;
        assert.ok(timeElapsed < 60);
        assert.ok(timeElapsed > 29);
        done();
      });
  });

  it("can writeData (parallel)", (done) => {
    let timeoutPerBatch = 10;
    let nbParallelTasks = 2;
    let acc = [];

    let source = createStream();
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

    let start = Date.now();
    source
      .pipe(
        writeData(
          (number) => {
            return delay(() => acc.push({ number, timestamp: Date.now() }), timeoutPerBatch);
          },
          { parallel: nbParallelTasks }
        )
      )
      .on("finish", () => {
        assert.deepStrictEqual(
          acc.map((v) => v.number),
          [1, 2, 3, 4, 5, 6]
        );

        // 2 tasks per batch with 10ms of timeout
        let timeElapsed = acc[acc.length - 1].timestamp - start;
        assert.ok(timeElapsed < 60);
        assert.ok(timeElapsed >= 29);
        done();
      });
  });
});
