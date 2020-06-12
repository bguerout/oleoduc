const { Transform } = require("stream");

module.exports = (transform, options = {}) => {
  let parallel = options.parallel || 1;
  let promises = [];
  let mustBeHandled = (value) => !options.filter || options.filter(value);

  return new Transform({
    objectMode: true,
    transform: async function (chunk, encoding, callback) {
      if (promises.length >= parallel) {
        await Promise.all(promises);
        promises = [];
      }

      if (!mustBeHandled(chunk)) {
        return callback();
      }

      try {
        let value = transform(chunk);
        promises.push(
          Promise.resolve(value)
            .then((res) => {
              if (mustBeHandled(res)) {
                this.push(res);
              }
              callback();
            })
            .catch((e) => callback(e))
        );
      } catch (e) {
        callback(e);
      }
    },
    async flush(done) {
      await Promise.all(promises);
      done();
    },
  });
};
