function parseArgs(args, defaults = {}) {
  let last = args[args.length - 1];
  let hasOption = typeof last === "object" && !Array.isArray(last) && typeof last.pipe !== "function";
  let options = {
    objectMode: true,
    ...defaults,
    ...(hasOption ? args.pop() : {}),
  };

  return {
    streams: Array.isArray(args[0]) ? args[0] : args,
    options,
  };
}

module.exports = parseArgs;
