import { oleoduc } from "./lib/oleoduc.mjs";
import { compose } from "./lib/compose.mjs";
import { transformData } from "./lib/transformData.mjs";
import { transformIntoJSON } from "./lib/transformIntoJSON.mjs";
import { transformIntoCSV } from "./lib/transformIntoCSV.mjs";
import { transformStream } from "./lib/transformStream.mjs";
import { filterData } from "./lib/filterData.mjs";
import { accumulateData } from "./lib/accumulateData.mjs";
import { groupData } from "./lib/groupData.mjs";
import { readLineByLine } from "./lib/readLineByLine.mjs";
import { flattenArray } from "./lib/flattenArray.mjs";
import { mergeStreams } from "./lib/mergeStreams.mjs";
import { concatStreams } from "./lib/concatStreams.mjs";
import { writeData } from "./lib/writeData.mjs";
import { writeToStdout } from "./lib/writeToStdout.mjs";

export {
  oleoduc,
  compose,
  transformData,
  transformIntoJSON,
  transformIntoCSV,
  transformStream,
  filterData,
  accumulateData,
  groupData,
  readLineByLine,
  flattenArray,
  mergeStreams,
  concatStreams,
  writeData,
  writeToStdout,
};
