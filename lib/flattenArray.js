const { Transform } = require("stream");

function parseOptionalArgs(...args) {
  let defaults = args.pop();
  let options = {
    ...defaults,
    ...(typeof args[args.length - 1] === "object" ? args.pop() : {}),
  };

  return {
    mapper: args.pop() || ((v) => v),
    options,
  };
}

function pushArray(array, index, transformer, callback) {
  if (index === array.length) {
    return callback();
  }

  // Handle back pressure internally because consuming a single written chunk can produce multiple readable chunk
  //FIXME Not sure this is the best way to resume on drain
  // https://stackoverflow.com/questions/20769132/whats-the-proper-way-to-handle-back-pressure-in-a-node-js-transform-stream
  let state = transformer._readableState;
  let destinations = state.multiAwaitDrain ? state.awaitDrainWriters : [state.awaitDrainWriters].filter((d) => !!d);
  if (transformer.push(array[index]) === false && destinations.length > 0) {
    let cpt = destinations.length;
    destinations.forEach(function (d) {
      d.once("drain", function () {
        if (--cpt === 0) {
          pushArray(array, index + 1, transformer, callback);
        }
      });
    });
  } else {
    pushArray(array, index + 1, transformer, callback);
  }
}

module.exports = (...args) => {
  let { mapper, options } = parseOptionalArgs(...args, { objectMode: true });
  return new Transform({
    ...options,
    transform: function (chunk, encoding, callback) {
      try {
        let array = mapper(chunk);
        pushArray(array, 0, this, callback);
      } catch (e) {
        callback(e);
      }
    },
  });
};
