function decorateWithPromise(stream, createPromise) {
  const descriptors = ["then", "catch", "finally"].map((property) => {
    return [property, Reflect.getOwnPropertyDescriptor(Promise.prototype, property)];
  });

  for (const [property, descriptor] of descriptors) {
    const value = (...args) => Reflect.apply(descriptor.value, createPromise(), args);
    Reflect.defineProperty(stream, property, { ...descriptor, value });
  }
  return stream;
}

module.exports = decorateWithPromise;
