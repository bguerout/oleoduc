const { Transform } = require("stream");

module.exports = (options = {}) => {
  let lines = 0;
  let separator = options.separator || ";";
  let enclosedInDoubleQuotes = (value) => (options.doubleQuotes ? `"${value}"` : value);

  return new Transform({
    objectMode: true,
    transform: function (chunk, encoding, callback) {
      let columns = options.columns;

      try {
        if (lines++ === 0) {
          let columnNames = Object.keys(columns || chunk)
            .map(enclosedInDoubleQuotes)
            .join(separator);
          this.push(`${columnNames}\n`);
        }

        let values = columns ? Object.keys(columns).map((key) => columns[key](chunk)) : Object.values(chunk);
        let line = values.map(enclosedInDoubleQuotes).join(separator);
        this.push(`${line}\n`);
        callback();
      } catch (e) {
        callback(e);
      }
    },
  });
};
