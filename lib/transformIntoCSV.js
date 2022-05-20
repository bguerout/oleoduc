const { Transform } = require("stream");

function transformIntoCSV(options = {}) {
  let lines = 0;
  let bom = options.bom;
  let separator = options.separator || ";";
  let mapper = options.mapper || ((v) => v);

  function generateColumnNames(chunk, columns) {
    return Object.keys(columns || chunk)
      .map(mapper)
      .join(separator);
  }

  async function generateColumnValues(chunk, columns) {
    let values;
    if (!columns) {
      values = Object.values(chunk);
    } else {
      let columnNames = Object.keys(columns);
      values = await Promise.all(columnNames.map((name) => columns[name](chunk)));
    }

    return values.map(mapper).join(separator);
  }

  return new Transform({
    objectMode: true,
    transform: async function (chunk, encoding, callback) {
      let columns = options.columns;

      try {
        if (lines++ === 0) {
          if (bom) {
            this.push("\ufeff");
          }
          this.push(`${generateColumnNames(chunk, columns)}\n`);
        }

        this.push(`${await generateColumnValues(chunk, columns)}\n`);
        callback();
      } catch (e) {
        callback(e);
      }
    },
  });
}

module.exports = transformIntoCSV;
