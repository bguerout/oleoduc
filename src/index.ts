import {accumulateData, AccumulateDataCallback, AccumulateDataOptions} from "./accumulateData.ts";
import {pipeStreams, PipeStreamsOptions} from "./pipeStreams.ts";
import {concatStreams} from "./concatStreams.ts";
import {filterData} from "./filterData.ts";
import {flattenArray} from "./flattenArray.ts";
import {groupData, GroupDataOptions} from "./groupData.ts";
import {mergeStreams} from "./mergeStreams.ts";
import {oleoduc, OleoducOptions} from "./oleoduc.ts";
import {readLineByLine} from "./readLineByLine.ts";
import {transformData, TransformDataCallback, TransformDataOptions} from "./transformData.ts";
import {transformIntoCSV, TransformIntoCSVOptions} from "./transformIntoCSV.ts";
import {transformIntoJSON, TransformIntoJSONOptions} from "./transformIntoJSON.ts";
import {transformStream, TransformStreamCallback} from "./transformStream.ts";
import {writeData, WriteDataCallback, WriteDataOptions} from "./writeData.ts";
import {writeToStdout} from "./writeToStdout.ts";

export {
    accumulateData,
    concatStreams,
    filterData,
    flattenArray,
    groupData,
    mergeStreams,
    oleoduc,
    pipeStreams,
    readLineByLine,
    transformData,
    transformIntoCSV,
    transformIntoJSON,
    transformStream,
    writeData,
    writeToStdout,
};

//Legacy from 0.8.x
export const compose = pipeStreams;

//Types
export {
    AccumulateDataCallback,
    AccumulateDataOptions,
    GroupDataOptions,
    OleoducOptions,
    PipeStreamsOptions,
    TransformDataCallback,
    TransformDataOptions,
    TransformIntoCSVOptions,
    TransformIntoJSONOptions,
    TransformStreamCallback,
    WriteDataCallback,
    WriteDataOptions,
};
