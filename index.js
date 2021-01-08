const transformData = require("./lib/transformData.js");

module.exports = {
  oleoduc: require("multipipe"),
  transformData,
  reduceData: require("./lib/reduceData.js"),
  filterData: (filter) => transformData((data) => data, { filter }),
  jsonStream: require("./lib/jsonStream.js"),
  csvStream: require("./lib/csvStream.js"),
  stdoutStream: require("./lib/stdoutStream.js"),
  writeData: require("./lib/writeData.js"),
};
