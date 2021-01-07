const { Writable } = require("stream");

module.exports = () => {
  return new Writable({
    write(chunk, encoding, callback) {
      //write to stdout as a side effect and honor finish event
      process.stdout.write(chunk, callback);
    },
  });
};
