import { compose } from "./compose.mjs";
import { accumulateData } from "./accumulateData.mjs";

function parseOptionalArgs(...args) {
  const options = {
    accumulator: [],
    ...(typeof args[args.length - 1] === "object" ? args.pop() : {}),
  };
  const size = options.size || 1;

  return {
    shouldFlush: args.pop() || ((group) => group.length === size),
    options,
  };
}

export function groupData(...args) {
  const { shouldFlush, options } = parseOptionalArgs(...args);

  return compose(
    accumulateData((acc, data, flush) => {
      const group = [...acc, data];
      if (shouldFlush(group)) {
        flush(group);
        return [];
      } else {
        return group;
      }
    }, options)
  );
}
