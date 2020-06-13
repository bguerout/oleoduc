const { Transform } = require("stream");

module.exports = (options = {}) => {
  let chunksSent = 0;
  return new Transform({
    readableObjectMode: false,
    writableObjectMode: true,
    transform: function (data, encoding, callback) {
      let shouldWrap = options.arrayWrapper || options.arrayPropertyName;
      if (chunksSent === 0) {
        if (shouldWrap) {
          let value = JSON.stringify(options.arrayWrapper || {});
          value = value.substring(0, value.length - 1);
          let comma = options.arrayWrapper ? "," : "";
          value += String(`${comma}"${options.arrayPropertyName}":[`);
          this.push(value);
        } else {
          this.push("[");
        }
      }
      if (chunksSent++ > 0) {
        this.push(",");
      }

      this.push(JSON.stringify(data));
      callback();
    },
    flush: function (callback) {
      let shouldWrap = options.arrayWrapper || options.arrayPropertyName;

      if (chunksSent === 0) {
        //nothing sent
        if (shouldWrap) {
          let value = options.arrayWrapper || {};
          value[options.arrayPropertyName] = [];
          this.push(JSON.stringify(value));
        } else {
          this.push("[]");
        }
      } else {
        //Close json properly
        this.push("]");
        if (shouldWrap) {
          this.push("}");
        }
      }
      return callback();
    },
  });
};
