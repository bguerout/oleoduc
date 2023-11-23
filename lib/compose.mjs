import { oleoduc } from "./oleoduc.mjs";
import { parseArgs } from "./utils/parseArgs.mjs";

export function compose(...args) {
  const { streams, options } = parseArgs(args, { promisify: false });
  return oleoduc(streams, options);
}
