const oleoduc = require("./oleoduc");
const accumulateData = require("./accumulateData");

function parseOptionalArgs(...args) {
  let options = {
    accumulator: [],
    ...(typeof args[args.length - 1] === "object" ? args.pop() : {}),
  };
  let size = options.size || 1;

  return {
    shouldFlush: args.pop() || ((group) => group.length === size),
    options,
  };
}

module.exports = (...args) => {
  let { shouldFlush, options } = parseOptionalArgs(...args);

  return oleoduc(
    accumulateData((acc, data, flush) => {
      let group = [...acc, data];
      if (shouldFlush(group)) {
        flush(group);
        return [];
      } else {
        return group;
      }
    }, options),

    { promisify: false }
  );
};
