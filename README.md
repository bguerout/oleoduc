# oleoduc

Oleoduc is a tiny layer over [multipipe](https://www.npmjs.com/package/multipipe)

Its brings utility functions to manipulate data when processing them.

## How to use

```sh
npm install oleoduc
# or
yarn add oleoduc
```
then import it

```js
const { oleoduc } = require("oleoduc");
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
const { oleoduc, transformObject, writeObject  } = require("oleoduc");

await oleoduc(
  stream,
  transformObject((data) => data * 2),
  writeObject((data) => console.log(data))
);
// Output:
//  20
//  40
```

### Handling objects

```js
const { oleoduc, transformObject, writeObject  } = require("oleoduc");

await oleoduc(
  stream,
  // Transforming integer into an object
  transformObject((data) => ({ field: data })),
  writeObject((obj) => console.log(obj))
);
// Output:
//  { field: 10 }
//  { field: 20 }
```

### Filtering data

```js
const { oleoduc, filterObject, writeObject  } = require("oleoduc");

await oleoduc(
  stream,
  filterObject((data) => data > 15),
  writeObject((data) => console.log(data))
);
// Output:
//  20
```

### Handling data in parallel

```js
const { oleoduc, transformObject, writeObject  } = require("oleoduc");

await oleoduc(
  stream,
  transformObject((data) => data * 10, { parallel: 5 }),
  writeObject((data) => console.log(data), { parallel: 2 })
);
```
Parallelism is handled by [parallel-transform](https://www.npmjs.com/package/parallel-transform)

### Piping

```js
const { transformObject, writeObject  } = require("oleoduc");

stream
  .pipe(transformObject((data) => data * 10))
  .pipe(writeObject((data) => console.log(data)))
  .on("finish", () => console.log("done"));
// Output:
//  10
//  20
//  done
```
