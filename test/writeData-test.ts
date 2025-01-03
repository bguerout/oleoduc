import {deepStrictEqual, fail, strictEqual} from "assert";
import {createStream} from "./testUtils";
import {writeData} from "../src";

describe("writeData", () => {
    it("should writeData", (done) => {
        const source = createStream();
        source.push("andré");
        source.push(null);
        const acc: string[] = [];

        source
            .pipe(
                writeData((data: string) => {
                    acc.push(data);
                }),
            )
            .on("finish", () => {
                deepStrictEqual(acc, ["andré"]);
                done();
            });
    });

    it("should writeData and handle synchronous error", (done) => {
        const source = createStream();
        source.push(1);
        source.push(null);

        source
            .pipe(
                writeData(
                    () => {
                        throw new Error("sync error");
                    },
                    {parallel: 1},
                ),
            )
            .on("error", (e) => {
                strictEqual(e.message, "sync error");
                done();
            })
            .on("finish", () => {
                fail();
                done();
            });
    });

    it("should writeData and handle asynchronous error (first chunk)", (done) => {
        const source = createStream();
        source.push("andré");
        source.push(null);

        source
            .pipe(
                writeData(() => {
                    return Promise.reject(new Error("first chunk"));
                }),
            )
            .on("error", (e) => {
                strictEqual(e.message, "first chunk");
                done();
            })
            .on("finish", () => {
                fail();
                done();
            });
    });

    it("should writeData and handle asynchronous error", (done) => {
        const source = createStream();
        source.push(1);
        source.push(2);
        source.push(3);
        source.push(null);
        const acc: number[] = [];

        source
            .pipe(
                writeData(
                    (data: number) => {
                        return new Promise<void>((resolve, reject) => {
                            if (data === 2) {
                                reject(new Error("async error"));
                            } else {
                                acc.push(data);
                                resolve();
                            }
                        });
                    },
                    {parallel: 1},
                ),
            )
            .on("error", (e) => {
                strictEqual(e.message, "async error");
                deepStrictEqual(acc, [1]);
                done();
            })
            .on("finish", () => {
                fail();
                done();
            });
    });
});
