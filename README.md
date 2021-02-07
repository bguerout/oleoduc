# oleoduc

oleoduc (french synonym of pipeline) provides utilities 
to manipulate data during a stream processing :

- `transformData` to transform data (eg. convert raw data into a json)
- `filterData` to select/exclude the data processed
- `transformIntoJSON` to convert data into a json array
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

## Examples

### Transform data into objects

```js
const { oleoduc, transformData, writeData } = require("oleoduc");

// Source:
// 1
// 2

oleoduc(
  source,
  transformData((data) => ({ field: data })),
  writeData((obj) => console.log(obj))
);

// Output:
//  { field: 1 }
//  { field: 2 }
```

### Stream data as if it where a json array

```js
const { oleoduc, transformIntoJSON } = require("oleoduc");
const { createWriteStream } = require("fs");

// Source:
// { field: 1 }
// { field: 22 }

await oleoduc(
  source,
  transformIntoJSON(),
  createWriteStream(file)
);

// Output
// [{ field: 1 }, { field: 2 }]

```

### Stream data as if it where a json array wrapped into an object

```js
const { oleoduc, transformIntoJSON } = require("oleoduc");
const { createWriteStream } = require("fs");

// Source:
// { field: 1 }
// { field: 2 }

await oleoduc(
  source,
  transformIntoJSON({ arrayWrapper: { other: "data" }, arrayPropertyName: "results" }),
  createWriteStream(file)
);

// Output
// { other: "data", results: [{ field: 1 }, { field: 2 }] }

```

### Handle errors

Using pipe

```js
const { oleoduc, writeData } = require("oleoduc");

oleoduc(
  source,
  writeData((obj) => throw new Error())
)
  .on("error", (e) => {
    //Handle error
  })
  .on("finish", () => {
    assert.fail();
    done();
  });

```

Using async/await

```js

try {
  await oleoduc(
    source,
    writeData((obj) => throw new Error())
  );
} catch (e) {
  //Handle error
}
```

### Filtering data

```js
const { oleoduc, filterData, writeData } = require("oleoduc");

// Source:
// 1
// 2

await oleoduc(
  source,
  filterData((data) => data > 1),
  writeData((data) => console.log(data))
);

// Output:
//  2
```

### Async

All utilities can return a promise.

```js
const { oleoduc, transformData, writeData } = require("oleoduc");

await oleoduc(
  source,
  transformData((data) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(data), 1000);
    });
  }),
  filterData(async (data) => {
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
  source,
  writeData((data) => save(data), { parallel: 2 })
);
```

Parallelism is handled by [parallel-transform](https://www.npmjs.com/package/parallel-transform)

### Stream composition

You can split your stream in multiple fragments

```js
const { transformData, writeData } = require("oleoduc");

let getSource = () => {
  return oleoduc(
    source,
    transformData((data) => data * 10)
  )
};

await oleoduc(
  getSource(),
  writeData((data) => console.log(data), { parallel: 2 })
);
```

### Source

Above examples can be tested with a readable stream

```js
let source = new Readable({
  objectMode: true,
  read() {},
});
source.push(1);
source.push(2);
source.push(null);
```
