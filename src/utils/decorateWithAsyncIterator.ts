import {Readable} from "node:stream";
import {toAsyncIterator} from "./toAsyncIterator.ts";

export function decorateWithAsyncIterator(stream: Readable) {
    stream[Symbol.asyncIterator] = () => toAsyncIterator(stream);
}
