const { Writable } = require("stream");

module.exports = (write, options = {}) => {
  let parallel = options.parallel || 1;

  let promises = [];

  return new Writable({
    objectMode: true,
    write: async (data, enc, done) => {
      if (promises.length >= parallel) {
        await Promise.all(promises);
        promises = [];
      }

      try {
        let value = write(data);
        promises.push(
          Promise.resolve(value)
            .then(() => done())
            .catch((e) => {
              done(e);
            })
        );
      } catch (e) {
        return done(e);
      }
    },
    end: async (chunk, encoding, done) => {
      await Promise.all(promises);
      done.apply(this, arguments);
    },
  });
};
