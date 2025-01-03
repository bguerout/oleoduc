import {toAsyncIterator} from "./toAsyncIterator";
import {Readable} from "stream";

export function decorateWithAsyncIterator(stream: Readable) {
    stream[Symbol.asyncIterator] = () => toAsyncIterator(stream);
}
