import { deepStrictEqual, fail } from "assert";
import { assertErrorMessage, createStream, delay } from "./testUtils";
import { compose, oleoduc, transformData, writeData } from "../src";

describe("oleoduc", () => {
  it("can create oleoduc", async () => {
    const chunks: string[] = [];
    const source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push("robert");
    source.push(null);

    await oleoduc(
      source,
      transformData((data: string) => {
        return delay(() => data.substring(0, 1), 2);
      }),
      writeData((data: string) => {
        return delay(() => chunks.push(data), 2);
      }),
    );

    deepStrictEqual(chunks, ["a", "b", "r"]);
  });

  it("can build oleoduc with first writeable and last readable (duplex)", async () => {
    const chunks: string[] = [];
    const source = createStream();
    source.push("andré");
    source.push("bruno");
    source.push("robert");
    source.push(null);

    try {
      await oleoduc(
        source,
        compose(
          transformData((data: string) => data.substring(0, 1)),
          transformData((data: string) => "_" + data),
        ),
        writeData((data: string) => chunks.push(data)),
      );
      deepStrictEqual(chunks, ["_a", "_b", "_r"]);
    } catch (e) {
      fail(e as Error);
    }
  });

  it("can use compose inside oleoduc", async () => {
    const chunks: string[] = [];
    const source = createStream();
    const composed = compose(
      source,
      transformData((d: string) => d.substring(0, 1)),
    );

    source.push("first");
    source.push(null);

    await oleoduc(
      composed,
      writeData((data: string) => chunks.push(data)),
    )
      .then(() => {
        deepStrictEqual(chunks, ["f"]);
      })
      .catch((e) => {
        fail(e);
      });
  });

  it("should propagate emitted error", (done) => {
    const source = createStream();

    oleoduc(
      source,
      writeData(() => ({})),
    )
      .then(() => {
        fail();
        done();
      })
      .catch((e) => {
        deepStrictEqual(e, "emitted");
        done();
      });

    source.push("first");
    source.emit("error", "emitted");
  });

  it("should propagate thrown error", async () => {
    const source = createStream();
    source.push("first");
    source.push(null);

    await oleoduc(
      source,
      writeData(() => {
        throw new Error("write error");
      }),
    )
      .then(() => {
        fail();
      })
      .catch((e) => {
        deepStrictEqual(e.message, "write error");
      });
  });

  it("should fail when no stream are provided", async () => {
    try {
      // @ts-expect-error TS2345
      await oleoduc();
      fail();
    } catch (e) {
      assertErrorMessage(e, "You must provide at least one stream");
    }
  });
});
