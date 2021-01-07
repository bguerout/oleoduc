const { Readable } = require("stream");
const { stdoutStream } = require("../index");

const createStream = () => {
  return new Readable({
    objectMode: true,
    read() {},
  });
};

describe(__filename, () => {
  it("should write to stdout", (done) => {
    let source = createStream();
    source.push("andré");
    source.push(null);

    source.pipe(stdoutStream()).on("finish", () => {
      //For the moment we just need to check that 'finish' event is honored
      //TODO find an easy way to test stdout
      done();
    });
  });
});
