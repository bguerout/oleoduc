import { toAsyncIterator } from "./toAsyncIterator";

export function decorateWithAsyncIterator(stream) {
  stream[Symbol.asyncIterator] = () => toAsyncIterator(stream);
}
