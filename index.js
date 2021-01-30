const transformData = require("./lib/transformData.js");
const splitStream = require("./lib/splitStream");

module.exports = {
  oleoduc: require("./lib/oleoduc.js"),
  mergeStreams: require("merge-stream"),
  transformData,
  filterData: (filter) => transformData((data) => data, { filter }),
  accumulateData: require("./lib/accumulateData.js"),
  lineStream: () => splitStream({ separator: /\r?\n/, trailing: false }),
  arrayStream: require("./lib/arrayStream.js"),
  jsonStream: require("./lib/jsonStream.js"),
  csvStream: require("./lib/csvStream.js"),
  stdoutStream: require("./lib/stdoutStream.js"),
  writeData: require("./lib/writeData.js"),
};
