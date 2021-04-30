const { Transform } = require("stream");

function defaultMapper(v) {
  return Array.isArray(v) ? v : [v];
}

function parseOptionalArgs(...args) {
  let options = {
    objectMode: true,
    ...(typeof args[args.length - 1] === "object" ? args.pop() : {}),
  };

  return {
    mapper: args.pop() || defaultMapper,
    options,
  };
}

function pushArray(array, index, transformer, done) {
  if (index === array.length) {
    return done();
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
          pushArray(array, index + 1, transformer, done);
        }
      });
    });
  } else {
    pushArray(array, index + 1, transformer, done);
  }
}

module.exports = (...args) => {
  let { mapper, options } = parseOptionalArgs(...args);
  return new Transform({
    ...options,
    transform: function (chunk, encoding, done) {
      try {
        let array = mapper(chunk);
        pushArray(array, 0, this, done);
      } catch (e) {
        done(e);
      }
    },
  });
};
