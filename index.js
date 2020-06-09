const util = require("util");
const { Transform, Writable } = require("stream");
const pipeline = util.promisify(require("stream").pipeline);
const combine = require("multipipe");

let transformObject = (transform, options = {}) => {
  let parallel = options.parallel || 1;
  let promises = [];
  let mustBeHandled = (value) => {
    return !options.ignoreEmpty || (value !== null && value !== undefined && Object.keys(value).length > 0);
  };

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

let writeObject = (write, options = {}) => {
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
module.exports = {
  pipeline,
  combine,
  transformObject,
  writeObject,
  ignoreEmpty: () => transformObject((data) => data, { ignoreEmpty: true }),
};
