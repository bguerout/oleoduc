const { transformData } = require("./transformData");

function filterData(filter, options = {}) {
  return transformData((data) => data, { ...options, filter });
}

module.exports = { filterData };
