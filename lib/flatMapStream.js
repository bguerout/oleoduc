const through = require("through");

module.exports = function (mapper = (c) => c) {
  return through(function (data) {
    var s = this;
    data.forEach(function (e) {
      s.queue(mapper(e));
    });
  });
};
