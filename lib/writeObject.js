const { Writable } = require("stream");

function reflect(res) {
  return Promise.resolve(res).then(
    (v) => ({ status: "fulfilled", value: v }),
    (error) => ({ status: "rejected", reason: error })
  );
}

class WriteParallelError extends Error {
  constructor(erros) {
    super(`An error occurred when handling chunks`);
    this.errors = erros;
  }
}

module.exports = (write, options = {}) => {
  let parallel = options.parallel || 1;
  function handleChunk({ chunk }) {
    return reflect(
      new Promise((resolve, reject) => {
        try {
          let res = write(chunk);
          Promise.resolve(res).then(resolve).catch(reject);
        } catch (e) {
          reject(e);
        }
      })
    );
  }

  class WriteObject extends Writable {
    constructor(options) {
      super({ objectMode: true, highWaterMark: parallel + 1, ...options });
    }
    _writev(chunks, callback) {
      let promises = chunks.map(handleChunk);
      Promise.all(promises).then((results) => {
        let rejected = results.filter((r) => r.status === "rejected");
        if (rejected.length > 0) {
          let error = new WriteParallelError(rejected.map((r) => r.reason));
          callback(error);
        } else {
          callback();
        }
      });
    }
  }

  return new WriteObject();
};
