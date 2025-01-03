import {deepStrictEqual} from "assert";
import {createSlowStream, createStream, delay, streamArray} from "./testUtils";
import {transformStream, writeData} from "../src";

describe("transformStream", () => {
    it("should transform data into a stream", (done) => {
        const chunks: string[] = [];
        const source = streamArray(["andré", "bruno"]);

        source
            .pipe(
                transformStream((data: string) => {
                    const source = createStream();
                    source.push(data + "_transformed");
                    source.push(null);
                    return source;
                }),
            )
            .pipe(
                writeData((data: string) => {
                    chunks.push(data);
                }),
            )
            .on("finish", () => {
                deepStrictEqual(chunks, ["andré_transformed", "bruno_transformed"]);
                done();
            });
    });

    it("should transform data into a stream (async)", (done) => {
        const chunks: string[] = [];
        const source = streamArray(["andré", "bruno"]);

        source
            .pipe(
                transformStream((data: string) => {
                    const source = createStream();

                    return delay(() => {
                        source.push(data + "_transformed");
                        source.push(null);
                        return source;
                    }, 20);
                }),
            )
            .pipe(
                writeData((data: string) => {
                    chunks.push(data);
                }),
            )
            .on("finish", () => {
                deepStrictEqual(chunks, ["andré_transformed", "bruno_transformed"]);
                done();
            });
    });

    it("should transform data into a stream (backpressure)", (done) => {
        const chunks: string[] = [];
        const source = streamArray(["andré"]);

        source
            .pipe(
                transformStream(
                    async (data: string) => {
                        const source = createStream();
                        for (let i = 0; i < 5; i++) {
                            source.push(data + "_transformed");
                        }
                        source.push(null);
                        return source;
                    },
                    {objectMode: true, highWaterMark: 1},
                ),
            )
            .pipe(createSlowStream({maxWriteInterval: 10})) // Force up streams to be paused
            .pipe(
                writeData((data: string) => {
                    chunks.push(data);
                }),
            )
            .on("finish", () => {
                deepStrictEqual(chunks, [
                    "andré_transformed",
                    "andré_transformed",
                    "andré_transformed",
                    "andré_transformed",
                    "andré_transformed",
                ]);
                done();
            });
    });
});
