import {deepStrictEqual, fail} from "assert";
import {createSlowStream, createStream} from "./testUtils.ts";
import {pipeStreams, flattenArray, transformData, writeData} from "../src/index.ts";

describe("pipeStreams", () => {
    it("can pipe streams", (done) => {
        const chunks: string[] = [];
        const source = createStream();
        source.push("first");
        source.push(null);

        pipeStreams(
            source,
            transformData((data: string) => data.substring(0, 1)),
            writeData((data: string) => {
                chunks.push(data);
            }),
        )
            .on("finish", () => {
                deepStrictEqual(chunks, ["f"]);
                done();
            })
            .on("error", () => {
                fail();
                done();
            });
    });

    it("can iterate over a piped stream", async () => {
        const chunks: string[] = [];
        const source = createStream();
        source.push("andré");
        source.push("bruno");
        source.push("robert");
        source.push(null);

        const stream = pipeStreams(
            source,
            transformData((data: string) => data.substring(0, 1)),
        );

        for await (const chunk of stream) {
            chunks.push(chunk.toString());
        }

        deepStrictEqual(chunks, ["a", "b", "r"]);
    });

    it("can pipe a pipe stream", (done) => {
        const chunks: string[] = [];
        const source = createStream();
        source.push("andré");
        source.push("bruno");
        source.push("robert");
        source.push(null);

        pipeStreams(source)
            .pipe(transformData((data: string) => data.substring(0, 1)))
            .pipe(
                writeData((data: string) => {
                    chunks.push(data);
                }),
            )
            .on("finish", () => {
                deepStrictEqual(chunks, ["a", "b", "r"]);
                done();
            });
    });

    it("can build pipe with first writeable and last readable (duplex)", (done) => {
        const chunks: string[] = [];
        const source = createStream();
        source.push("andré");
        source.push("bruno");
        source.push("robert");
        source.push(null);

        source
            .pipe(
                pipeStreams(
                    transformData((data: string) => data.substring(0, 1)),
                    transformData((data) => "_" + data),
                ),
            )
            .pipe(
                writeData((data: string) => {
                    chunks.push(data);
                }),
            )
            .on("finish", () => {
                deepStrictEqual(chunks, ["_a", "_b", "_r"]);
                done();
            });
    });

    it("can pipe inside a pipe", (done) => {
        const chunks: string[] = [];
        const source = createStream();
        const nested = pipeStreams(
            source,
            transformData((d: string) => d.substring(0, 1)),
        );

        source.push("first");
        source.push(null);

        pipeStreams(
            nested,
            writeData((data: string) => {
                chunks.push(data);
            }),
        )
            .on("finish", () => {
                deepStrictEqual(chunks, ["f"]);
                done();
            })
            .on("error", (e) => {
                fail(e);
                done();
            });
    });

    it("can handle back pressure", (done) => {
        let result = "";
        const source = createStream();
        source.push(["andré", "bruno", "robert"]);
        source.push(null);

        pipeStreams(
            source,
            flattenArray({highWaterMark: 1}),
            createSlowStream({maxWriteInterval: 10}),
            writeData((data: string) => {
                result += data;
            }),
        ).on("finish", () => {
            deepStrictEqual(result, "andrébrunorobert");
            done();
        });
    });

    it("can handle back pressure with nested pipe", (done) => {
        let result = "";
        const source = createStream();
        source.push(["andré", "bruno", "robert"]);
        source.push(null);

        pipeStreams(
            source,
            pipeStreams(flattenArray({highWaterMark: 1}), createSlowStream({maxWriteInterval: 10})),
            writeData((data: string) => {
                result += data;
            }),
        ).on("finish", () => {
            deepStrictEqual(result, "andrébrunorobert");
            done();
        });
    });

    it("should propagate emitted error", (done) => {
        const source = createStream();

        pipeStreams(
            source,
            writeData(() => {}),
        )
            .on("finish", () => {
                fail();
                done();
            })
            .on("error", (e) => {
                deepStrictEqual(e, "emitted");
                done();
            });

        source.push("first");
        source.emit("error", "emitted");
    });

    it("should propagate thrown error", (done) => {
        const source = createStream();
        source.push("first");
        source.push(null);

        pipeStreams(
            source,
            writeData(() => {
                throw new Error("write error");
            }),
        )
            .on("finish", () => {
                fail();
                done();
            })
            .on("error", (e) => {
                deepStrictEqual(e.message, "write error");
                done();
            });
    });
});
