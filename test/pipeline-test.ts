import {deepStrictEqual, fail} from "assert";
import {pipeline} from "stream";
import {promisify} from "util";
import {createStream, delay} from "./testUtils.ts";
import {transformData, writeData} from "../src/index.ts";

describe("pipeline", () => {
    it("can create pipeline from stream", (done) => {
        const chunks: string[] = [];
        const source = createStream();
        source.push("andré");
        source.push("bruno");
        source.push("robert");
        source.push(null);

        pipeline(
            source,
            transformData((data: string) => data.substring(0, 1)),
            writeData((data: string) => chunks.push(data)),
            (err) => {
                if (err) {
                    return done(err);
                }
                deepStrictEqual(chunks, ["a", "b", "r"]);
                return done();
            },
        );
    });

    it("can create pipeline from stream (async)", async () => {
        const chunks: string[] = [];
        const source = createStream();
        source.push("andré");
        source.push("bruno");
        source.push("robert");
        source.push(null);

        await promisify(pipeline)(
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

    it("pipeline should propagate emitted error", (done) => {
        const source = createStream();

        promisify(pipeline)(
            source,
            writeData(() => ({})),
        )
            .then(() => {
                fail();
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
            }),
        )
            .then(() => {
                fail();
                done();
            })
            .catch(() => {
                done();
            });
    });
});
