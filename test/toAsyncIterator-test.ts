import {deepStrictEqual, fail} from "assert";
import {assertErrorMessage, createStream} from "./testUtils.ts";
import {toAsyncIterator} from "../src/utils/toAsyncIterator.ts";
import {compose, transformData} from "../src/index.ts";

describe("toAsyncIterator", () => {
    it("can convert a readable stream into an iterator", async () => {
        const readable = createStream();
        readable.push("a");
        readable.push("b");
        readable.push("c");
        readable.push(null);

        const chunks = [];
        for await (const chunk of toAsyncIterator(readable)) {
            chunks.push(chunk);
        }

        deepStrictEqual(chunks, ["a", "b", "c"]);
    });

    it("iterator should honor error", async () => {
        const readable = createStream();
        const failingStream = compose(
            readable,
            transformData(() => {
                throw new Error("This is a stream error");
            }),
        );
        readable.push("a");
        readable.push("b");

        try {
            const iterator = toAsyncIterator(failingStream);
            await iterator.next();
            fail();
        } catch (e) {
            assertErrorMessage(e, "This is a stream error");
        }

        readable.push(null);
    });
});
