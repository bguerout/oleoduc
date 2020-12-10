const transformData = require("./lib/transformData.js");

module.exports = {
  oleoduc: require("multipipe"),
  transformData,
  filterObject: (filter) => transformData((data) => data, { filter }),
  writeData: require("./lib/writeData.js"),
  jsonStream: require("./lib/jsonStream.js"),
};
