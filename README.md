# oleoduc

oleoduc provides utilities to manipulate data when they flow through an _oleoduc_ (french synonym of pipeline) :

- `transformData` to transform data (eg. convert raw data into a json)
- `filterData` to select/exclude the data processed
- `writeData` allows data to be written somewhere (last step)

These functions can be used on any stream or inside a pipeline:

```js
const { transformData, writeData } = require("oleoduc");

stream
  .pipe(transformData((data) => data.toString()))
  .pipe(writeData((data) => console.log(data)))
  .on("finish", () => console.log("done"))
```

```js
const { pipeline } = require('stream');
const { transformData, writeData } = require("oleoduc");

pipeline(
  transformData((data) => data.toString()),
  writeData((data) => console.log(data)),
)
```

Using `pipe` or `pipeline` can be sometimes painful, oleoduc provides a utility function named `oleoduc`
(based on [multipipe](https://www.npmjs.com/package/multipipe)). This function allows composition of streams and better
error handling.

```js
const { oleoduc, transformData, writeData } = require("oleoduc");

oleoduc(
  transformData((data) => data.toString()),
  writeData((data) => console.log(data)),
)
```

## Install

```sh
npm install oleoduc
# or
yarn add oleoduc
```

## Common use cases

Below examples assume the following stream as source

```js
let stream = createStream();
stream.push(1);
stream.push(2);
stream.push(null);
```

### Transform data into objects

```js
const { oleoduc, transformData, writeData } = require("oleoduc");

oleoduc(
  stream,
  // Transforming integer into an object
  transformData((data) => ({ field: data })),
  writeData((obj) => console.log(obj))
);
// Output:
//  { field: 10 }
//  { field: 20 }
```

### Handle errors

```js
const { oleoduc, writeData } = require("oleoduc");

//Using pipe
oleoduc(
  stream,
  writeData((obj) => throw new Error())
)
  .on("error", (e) => {
    //Handle error
  })
  .on("finish", () => {
    assert.fail();
    done();
  });


//Using async/await
try {
  await oleoduc(
    stream,
    writeData((obj) => throw new Error())
  );
} catch (e) {
  //Handle error
}
```

### Filtering data

```js
const { oleoduc, filterObject, writeData } = require("oleoduc");

await oleoduc(
  stream,
  filterObject((data) => data > 15),
  writeData((data) => console.log(data))
);
// Output:
//  20
```

### Async

- All utilities can return a promise.

```js
const { oleoduc, transformData, writeData } = require("oleoduc");

await oleoduc(
  stream,
  transformData((data) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(data), 1000);
    });
  }),
  filterObject(async (data) => {
    let value = await retrieveValue();
    return value > data;
  }),
  writeData((obj) => console.log(obj))
);
```

### Handling data in parallel

```js
const { oleoduc, transformData, writeData } = require("oleoduc");

await oleoduc(
  stream,
  writeData((data) => save(data), { parallel: 2 })
);
```

Parallelism is handled by [parallel-transform](https://www.npmjs.com/package/parallel-transform)

### Stream composition

You can split your stream in multiple fragments

```js
const { transformData, writeData } = require("oleoduc");

let getTransformedStream = (source) => {
  return oleoduc(
    source,
    transformData((data) => data * 10)
  )
};

await oleoduc(
  getTransformedStream(stream),
  writeData((data) => console.log(data), { parallel: 2 })
);
```
