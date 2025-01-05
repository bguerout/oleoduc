import {accumulateData} from "./accumulateData.ts";
import {pipeStreams} from "./pipeStreams.ts";
import {concatStreams} from "./concatStreams.ts";
import {filterData} from "./filterData.ts";
import {flattenArray} from "./flattenArray.ts";
import {groupData} from "./groupData.ts";
import {mergeStreams} from "./mergeStreams.ts";
import {oleoduc} from "./oleoduc.ts";
import {readLineByLine} from "./readLineByLine.ts";
import {transformData} from "./transformData.ts";
import {transformIntoCSV} from "./transformIntoCSV.ts";
import {transformIntoJSON} from "./transformIntoJSON.ts";
import {transformStream} from "./transformStream.ts";
import {writeData} from "./writeData.ts";
import {writeToStdout} from "./writeToStdout.ts";

//Legacy from 0.8.x
const compose = pipeStreams;

export {
    accumulateData,
    pipeStreams,
    compose,
    concatStreams,
    filterData,
    flattenArray,
    groupData,
    mergeStreams,
    oleoduc,
    readLineByLine,
    transformData,
    transformIntoCSV,
    transformIntoJSON,
    transformStream,
    writeData,
    writeToStdout,
};
