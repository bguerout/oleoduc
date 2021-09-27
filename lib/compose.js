const oleoduc = require("./oleoduc");
const parseArgs = require("./utils/parseArgs");

function compose(...args) {
  let { streams, options } = parseArgs(args, { promisify: false });
  return oleoduc(streams, options);
}

module.exports = compose;
