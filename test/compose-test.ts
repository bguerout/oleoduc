import {deepStrictEqual, fail} from "assert";
import {createSlowStream, createStream} from "./testUtils.ts";
import {compose, flattenArray, transformData, writeData} from "../src/index.ts";

describe("compose", () => {
    it("can compose streams", (done) => {
        const chunks: string[] = [];
        const source = createStream();
        source.push("first");
        source.push(null);

        compose(
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

    it("can iterate over a composed stream", async () => {
        const chunks: string[] = [];
        const source = createStream();
        source.push("andré");
        source.push("bruno");
        source.push("robert");
        source.push(null);

        const stream = compose(
            source,
            transformData((data: string) => data.substring(0, 1)),
        );

        for await (const chunk of stream) {
            chunks.push(chunk.toString());
        }

        deepStrictEqual(chunks, ["a", "b", "r"]);
    });

    it("can pipe a compose stream", (done) => {
        const chunks: string[] = [];
        const source = createStream();
        source.push("andré");
        source.push("bruno");
        source.push("robert");
        source.push(null);

        compose(source)
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

    it("can build compose with first writeable and last readable (duplex)", (done) => {
        const chunks: string[] = [];
        const source = createStream();
        source.push("andré");
        source.push("bruno");
        source.push("robert");
        source.push(null);

        source
            .pipe(
                compose(
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

    it("can compose inside compose", (done) => {
        const chunks: string[] = [];
        const source = createStream();
        const nested = compose(
            source,
            transformData((d: string) => d.substring(0, 1)),
        );

        source.push("first");
        source.push(null);

        compose(
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

        compose(
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

    it("can handle back pressure with nested compose", (done) => {
        let result = "";
        const source = createStream();
        source.push(["andré", "bruno", "robert"]);
        source.push(null);

        compose(
            source,
            compose(flattenArray({highWaterMark: 1}), createSlowStream({maxWriteInterval: 10})),
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

        compose(
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

        compose(
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
