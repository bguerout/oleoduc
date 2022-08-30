function parseArgs(args, defaults = {}) {
  const last = args[args.length - 1];
  const hasOption = typeof last === "object" && !Array.isArray(last) && typeof last.pipe !== "function";
  const options = {
    objectMode: true,
    ...defaults,
    ...(hasOption ? args.pop() : {}),
  };

  return {
    streams: Array.isArray(args[0]) ? args[0] : args,
    options,
  };
}

module.exports = { parseArgs };
