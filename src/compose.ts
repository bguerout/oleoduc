import { oleoduc } from "./oleoduc";
import { parseArgs } from "./utils/parseArgs";

export function compose(...args) {
  const { streams, options } = parseArgs(args, { promisify: false });
  return oleoduc(streams, options);
}
