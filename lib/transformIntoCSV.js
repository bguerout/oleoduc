const { Transform } = require("stream");

module.exports = (options = {}) => {
  let lines = 0;
  let bom = options.bom;
  let separator = options.separator || ";";
  let mapper = options.mapper || ((v) => v);

  return new Transform({
    objectMode: true,
    transform: function (chunk, encoding, callback) {
      let columns = options.columns;

      try {
        if (lines++ === 0) {
          let columnNames = Object.keys(columns || chunk)
            .map(mapper)
            .join(separator);
          if (bom) {
            this.push("\ufeff");
          }
          this.push(`${columnNames}\n`);
        }

        let values = columns ? Object.keys(columns).map((key) => columns[key](chunk)) : Object.values(chunk);
        let line = values.map(mapper).join(separator);
        this.push(`${line}\n`);
        callback();
      } catch (e) {
        callback(e);
      }
    },
  });
};
