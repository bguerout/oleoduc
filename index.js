const util = require("util");
const transformObject = require("./lib/transformObject.js");

module.exports = {
  transformObject,
  writeObject: require("./lib/writeObject.js"),
  pipeline: util.promisify(require("stream").pipeline),
  combine: require("multipipe"),
  ignoreEmpty: () => transformObject((data) => data, { ignoreEmpty: true }),
};
