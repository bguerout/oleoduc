const assert = require("assert");
const { createStream } = require("./testUtils.js");
const { readLineByLine, writeData, oleoduc } = require("../index");

describe("readLineByLine", () => {
  it("can read a stream line by line", (done) => {
    const result = [];
    const source = createStream();
    source.push("ab");
    source.push("c\ndef\ng");
    source.push("hi\n");
    source.push(null);

    source
      .pipe(readLineByLine())
      .pipe(
        writeData((data) => {
          return result.push(data);
        })
      )
      .on("finish", () => {
        assert.deepStrictEqual(result, ["abc", "def", "ghi"]);
        done();
      });
  });

  it("can read a stream line by line (CRLF)", (done) => {
    const result = [];
    const source = createStream();
    source.push("ab");
    source.push("c\r\ndef\r\ng");
    source.push("hi\r\n");
    source.push(null);

    source
      .pipe(readLineByLine())
      .pipe(
        writeData((data) => {
          return result.push(data);
        })
      )
      .on("finish", () => {
        assert.deepStrictEqual(result, ["abc", "def", "ghi"]);
        done();
      });
  });

  it("can handle content without carriage return on the last line", (done) => {
    const result = [];
    const source = createStream();
    source.push("ab\n");
    source.push("hi");
    source.push(null);

    source
      .pipe(readLineByLine())
      .pipe(
        writeData((data) => {
          return result.push(data);
        })
      )
      .on("finish", () => {
        assert.deepStrictEqual(result, ["ab", "hi"]);
        done();
      });
  });

  it("can read multiple lines with backpressure", async () => {
    const array = [];
    const source = createStream();
    const manyLines = Array(250)
      .fill("line")
      .map((v, i) => `${v}-${i}\n`)
      .join("");

    source.push(manyLines);
    source.push(null);

    await oleoduc(
      source,
      readLineByLine(),
      writeData((opco) => {
        array.push(opco);
      })
    );

    assert.deepStrictEqual(array[0], "line-0");
    assert.deepStrictEqual(array[array.length - 1], "line-249");
  });
});
