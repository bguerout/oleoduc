const util = require("util");
const transformObject = require("./lib/transformObject.js");

module.exports = {
  oleoduc: util.promisify(require("stream").pipeline),
  combine: require("multipipe"),
  transformObject,
  filterObject: (filter) => transformObject((data) => data, { filter }),
  writeObject: require("./lib/writeObject.js"),
  jsonStream: require("./lib/jsonStream.js"),
};
