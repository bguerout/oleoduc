const { Writable } = require("stream");

function writeToStdout() {
  return new Writable({
    write(chunk, encoding, callback) {
      //write to stdout as a side effect and honor finish event
      //https://stackoverflow.com/questions/33190458/node-pipe-to-stdout-how-do-i-tell-if-drained
      process.stdout.write(chunk, callback);
    },
  });
}

module.exports = writeToStdout;
