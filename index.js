const transformData = require("./lib/transformData.js");

module.exports = {
  oleoduc: require("./lib/oleoduc.js"),
  mergeStreams: require("merge-stream"),
  transformData,
  accumulateData: require("./lib/accumulateData.js"),
  filterData: (filter) => transformData((data) => data, { filter }),
  arrayStream: require("./lib/arrayStream.js"),
  jsonStream: require("./lib/jsonStream.js"),
  csvStream: require("./lib/csvStream.js"),
  stdoutStream: require("./lib/stdoutStream.js"),
  writeData: require("./lib/writeData.js"),
};
