import { toAsyncIterator } from "./toAsyncIterator.mjs";

export function decorateWithAsyncIterator(stream) {
  stream[Symbol.asyncIterator] = () => toAsyncIterator(stream);
}
