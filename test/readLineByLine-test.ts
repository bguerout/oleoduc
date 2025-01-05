import {deepStrictEqual} from "assert";
import {createStream} from "./testUtils.ts";
import {oleoduc, readLineByLine, writeData} from "../src/index.ts";

describe("readLineByLine", () => {
    it("can read a stream line by line", (done) => {
        const result: string[] = [];
        const source = createStream();
        source.push("ab");
        source.push("c\ndef\ng");
        source.push("hi\n");
        source.push(null);

        source
            .pipe(readLineByLine())
            .pipe(
                writeData((data: string) => {
                    result.push(data);
                }),
            )
            .on("finish", () => {
                deepStrictEqual(result, ["abc", "def", "ghi"]);
                done();
            });
    });

    it("can read a stream line by line (CRLF)", (done) => {
        const result: string[] = [];
        const source = createStream();
        source.push("ab");
        source.push("c\r\ndef\r\ng");
        source.push("hi\r\n");
        source.push(null);

        source
            .pipe(readLineByLine())
            .pipe(
                writeData((data: string) => {
                    result.push(data);
                }),
            )
            .on("finish", () => {
                deepStrictEqual(result, ["abc", "def", "ghi"]);
                done();
            });
    });

    it("can handle content without carriage return on the last line", (done) => {
        const result: string[] = [];
        const source = createStream();
        source.push("ab\n");
        source.push("hi");
        source.push(null);

        source
            .pipe(readLineByLine())
            .pipe(
                writeData((data: string) => {
                    result.push(data);
                }),
            )
            .on("finish", () => {
                deepStrictEqual(result, ["ab", "hi"]);
                done();
            });
    });

    it("can read multiple lines with backpressure", async () => {
        const array: string[] = [];
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
            writeData((opco: string) => {
                array.push(opco);
            }),
        );

        deepStrictEqual(array[0], "line-0");
        deepStrictEqual(array[array.length - 1], "line-249");
    });
});
