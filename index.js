const oleoduc = require("./lib/oleoduc.js");
const transformData = require("./lib/transformData.js");
const splitStream = require("./lib/splitStream");

module.exports = {
  oleoduc,
  transformData,
  filterData: (filter) => transformData((data) => data, { filter }),
  accumulateData: require("./lib/accumulateData.js"),
  writeData: require("./lib/writeData.js"),
  mergeStreams: require("./lib/mergeStreams.js"),
  multiStream: (...streams) => oleoduc(...streams, { promisify: false }),
  lineStream: () => splitStream({ separator: /\r?\n/, trailing: false }),
  flatMapStream: require("./lib/flatMapStream.js"),
  jsonStream: require("./lib/jsonStream.js"),
  csvStream: require("./lib/csvStream.js"),
  stdoutStream: require("./lib/stdoutStream.js"),
};
