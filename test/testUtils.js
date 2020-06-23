module.exports = {
  delay: (callback, delay) => {
    return new Promise((resolve) => {
      return setTimeout(async () => {
        resolve(callback());
      }, delay);
    });
  },
};
