const { createStream } = require("./testUtils.js");
const { writeToStdout } = require("../index");

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
