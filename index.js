const exported = {
  oleoduc: require("./lib/oleoduc.js"),
  compose: require("./lib/compose.js"),
  transformData: require("./lib/transformData.js"),
  transformIntoJSON: require("./lib/transformIntoJSON.js"),
  transformIntoCSV: require("./lib/transformIntoCSV.js"),
  flattenStream: require("./lib/flattenStream.js"),
  filterData: require("./lib/filterData"),
  accumulateData: require("./lib/accumulateData.js"),
  groupData: require("./lib/groupData"),
  readLineByLine: require("./lib/readLineByLine"),
  flattenArray: require("./lib/flattenArray.js"),
  mergeStreams: require("./lib/mergeStreams.js"),
  writeData: require("./lib/writeData.js"),
  writeToStdout: require("./lib/writeToStdout.js"),
};

//CJS
module.exports = exported;

//ESM (+rollup)
Object.keys(exported).forEach((key) => (module.exports[key] = exported[key]));
