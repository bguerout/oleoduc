export function decorateWithPromise(stream, promise) {
  const descriptors = ["then", "catch", "finally"].map((property) => {
    return { property, descriptor: Reflect.getOwnPropertyDescriptor(Promise.prototype, property) };
  });

  for (const { property, descriptor } of descriptors) {
    const value = (...args) => Reflect.apply(descriptor.value, promise, args);
    Reflect.defineProperty(stream, property, { ...descriptor, value });
  }
  return stream;
}
