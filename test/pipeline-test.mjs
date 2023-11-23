import assert from "assert";
import { pipeline } from "stream";
import { promisify } from "util";
import { createStream, delay } from "./testUtils.mjs";
import { transformData, writeData } from "../index.mjs";

describe("pipeline", () => {
  it("can create pipeline from stream", (done) => {
    const chunks = [];
    const source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push("robert");
    source.push(null);

    pipeline(
      source,
      transformData((data) => data.substring(0, 1)),
      writeData((data) => chunks.push(data)),
      (err) => {
        if (err) {
          return done(err);
        }
        assert.deepStrictEqual(chunks, ["a", "b", "r"]);
        return done();
      }
    );
  });

  it("can create pipeline from stream (async)", async () => {
    const chunks = [];
    const source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push("robert");
    source.push(null);

    await promisify(pipeline)(
      source,
      transformData((data) => {
        return delay(() => data.substring(0, 1), 2);
      }),
      writeData((data) => {
        return delay(() => chunks.push(data), 2);
      })
    );

    assert.deepStrictEqual(chunks, ["a", "b", "r"]);
  });

  it("pipeline should propagate emitted error", (done) => {
    const source = createStream();

    promisify(pipeline)(
      source,
      writeData(() => ({}))
    )
      .then(() => {
        assert.fail();
        done();
      })
      .catch(() => {
        done();
      });

    source.push("first");
    source.emit("error", "emitted");
  });

  it("pipeline should propagate thrown error", (done) => {
    const source = createStream();
    source.push("first");
    source.push(null);

    promisify(pipeline)(
      source,
      writeData(() => {
        throw new Error();
      })
    )
      .then(() => {
        assert.fail();
        done();
      })
      .catch(() => {
        done();
      });
  });
});
