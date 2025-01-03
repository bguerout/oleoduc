import {createStream} from "./testUtils";
import {writeToStdout} from "../src";

describe("writeToStdout", () => {
    it("should write to stdout", (done) => {
        const source = createStream();
        source.push("andré");
        source.push(null);

        source.pipe(writeToStdout()).on("finish", () => {
            //For the moment we just need to check that 'finish' event is honored
            //TODO find an easy way to test stdout
            done();
        });
    });
});
