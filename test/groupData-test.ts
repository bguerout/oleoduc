import {deepStrictEqual} from "assert";
import {createStream} from "./testUtils.ts";
import {groupData, writeData} from "../src/index.ts";

describe("groupData", () => {
    it("can create group of data", (done) => {
        const results: string[][] = [];
        const source = createStream();
        source.push("abc");
        source.push("def");
        source.push("ghi");
        source.push(null);

        source
            .pipe(groupData())
            .pipe(
                writeData((group: string[]) => {
                    return results.push(group);
                }),
            )
            .on("finish", () => {
                deepStrictEqual(results, [["abc"], ["def"], ["ghi"]]);
                done();
            });
    });

    it("can create group of data with custom size", (done) => {
        const results: string[][] = [];
        const source = createStream();
        source.push("abc");
        source.push("def");
        source.push("ghi");
        source.push(null);

        source
            .pipe(groupData({size: 2}))
            .pipe(
                writeData((group: string[]) => {
                    return results.push(group);
                }),
            )
            .on("finish", () => {
                deepStrictEqual(results, [["abc", "def"], ["ghi"]]);
                done();
            });
    });
});
