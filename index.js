const transformData = require("./lib/transformData.js");

module.exports = {
  oleoduc: require("./lib/oleoduc.js"),
  transformData,
  transformIntoJSON: require("./lib/transformIntoJSON.js"),
  transformIntoCSV: require("./lib/transformIntoCSV.js"),
  filterData: (filter, options = {}) => transformData((data) => data, { ...options, filter }),
  accumulateData: require("./lib/accumulateData.js"),
  groupData: require("./lib/groupData"),
  readLineByLine: require("./lib/readLineByLine"),
  flattenArray: require("./lib/flattenArray.js"),
  writeData: require("./lib/writeData.js"),
  writeToStdout: require("./lib/writeToStdout.js"),
};
