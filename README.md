# oleoduc

Oleoduc is a tiny layer over [multipipe](https://www.npmjs.com/package/multipipe)

Its brings utility functions to manipulate data when processing them.

## How to use

```sh
npm install oleoduc
# or
yarn add oleoduc
```

Below examples assume the following stream as source

```js
let stream = createStream();
stream.push(1);
stream.push(2);
stream.push(null);
```

### Reading a stream, transforming data and writing them

```js
const { multipipe, transformData, writeData  } = require("oleoduc");

await multipipe(
  stream,
  transformData((data) => data * 2),
  writeData((data) => console.log(data))
);
// Output:
//  20
//  40
```

### Handling objects

```js
const { multipipe, transformData, writeData  } = require("oleoduc");

await multipipe(
  stream,
  // Transforming integer into an object
  transformData((data) => ({ field: data })),
  writeData((obj) => console.log(obj))
);
// Output:
//  { field: 10 }
//  { field: 20 }
```

### Filtering data

```js
const { multipipe, filterObject, writeData  } = require("oleoduc");

await multipipe(
  stream,
  filterObject((data) => data > 15),
  writeData((data) => console.log(data))
);
// Output:
//  20
```

### Handling data in parallel

```js
const { multipipe, transformData, writeData  } = require("oleoduc");

await multipipe(
  stream,
  transformData((data) => data * 10, { parallel: 5 }),
  writeData((data) => console.log(data), { parallel: 2 })
);
```
Parallelism is handled by [parallel-transform](https://www.npmjs.com/package/parallel-transform)

### Piping

```js
const { transformData, writeData  } = require("oleoduc");

stream
  .pipe(transformData((data) => data * 10))
  .pipe(writeData((data) => console.log(data)))
  .on("finish", () => console.log("done"));
// Output:
//  10
//  20
//  done
```
