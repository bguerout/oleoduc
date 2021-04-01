const transformData = require("./lib/transformData.js");

module.exports = {
  oleoduc: require("./lib/oleoduc.js"),
  transformData,
  transformIntoJSON: require("./lib/transformIntoJSON.js"),
  transformIntoCSV: require("./lib/transformIntoCSV.js"),
  filterData: (filter) => transformData((data) => data, { filter }),
  accumulateData: require("./lib/accumulateData.js"),
  chunk: require("./lib/chunk"),
  readLineByLine: require("./lib/readLineByLine"),
  flattenArray: require("./lib/flattenArray.js"),
  writeData: require("./lib/writeData.js"),
  writeToStdout: require("./lib/writeToStdout.js"),
};
