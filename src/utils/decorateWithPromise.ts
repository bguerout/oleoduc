export function decorateWithPromise(stream, promise) {
  const descriptors = ["then", "catch", "finally"].map((property) => {
    return [property, Reflect.getOwnPropertyDescriptor(Promise.prototype, property)];
  });

  for (const [property, descriptor] of descriptors) {
    // @ts-ignore
    const value = (...args) => Reflect.apply(descriptor.value, promise, args);
    // @ts-ignore
    Reflect.defineProperty(stream, property, { ...descriptor, value });
  }
  return stream;
}
