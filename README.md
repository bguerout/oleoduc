# oleoduc

Streams are one of the best concepts in nodejs but are often used only for IO and low level stuff.

```sh
npm install oleoduc
# or
yarn add oleoduc
```

oleoduc (french synonym of pipeline) provides tools to stream the data you manipulate in your day to day work.

```js
const { oleoduc, transformData, writeData } = require("oleoduc");
const { Readable } = require("stream");

let source = Readable.from(["Hello", "World"]);

await oleoduc(
  source,
  transformData((data) => data.toString()),
  writeData((data) => console.log(data)),
)
```

## Practical examples:

Stream MongoDB documents to client through an express server

```js
const express = require("express");
const { oleoduc, transformIntoJSON } = require("oleoduc");

const app = express();
app.get("/documents", async (req, res) => {
    oleoduc(
      db.collection("documents").find(),
      transformIntoJSON(),
      res
    );
  }
);
```

Import file into a database without loading all content into the memory

```js
const { oleoduc, readLineByLine, transformData, writeData } = require("oleoduc");
const { createReadStream } = require("fs");

await oleoduc(
  createReadStream("/path/to/file"),
  readLineByLine(),
  transformData((line) => JSON.parse(line)),
  writeData((json) => db.save(json)),
)
```

## API

### oleoduc(...streams, [options])

Pipe streams together, forwards errors and returns a promisified stream.

Based on [duplexer3](https://www.npmjs.com/package/duplexer3) and inspired
by [multipipe](https://www.npmjs.com/package/multipipe), it is same as nodejs
core [pipeline](https://nodejs.org/api/stream.html#stream_stream_pipeline_source_transforms_destination_callback) but
with stream composition capability.

#### Parameters

- `streams`: A list of streams to pipe together
- `options`:
    - `promisify`: Make returned stream also a promise (default: `true`)
    - `*`:    The rest of the options is passed to duplexer3

#### Examples

Compose streams

```js
const { transformData, writeData } = require("oleoduc");

async function getSource() {
  let cursor = await getDataFromDB();
  return oleoduc(
    cursor,
    transformData((data) => data.value * 10),
    { promisify: false } //do not promisify the stream 
  )
};

let source = await getSource();
await oleoduc(
  source,
  writeData((data) => console.log(data))
);
```

Create an oleoduc and handle errors with an event listener

```js
const { oleoduc, writeData } = require("oleoduc");

oleoduc(
  source,
  writeData((obj) => throw new Error())
)
  .on("error", (e) => {
    //Handle error
  });

```

Create an oleoduc and handle errors with async/await and try/catch

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

### transformData

`transformData` allows data to be manipulated and transformed during a stream processing.

Note that by default a chunk is processed just after the previous one has been pushed to the next step (sequentially).

This behaviour can be changed to transform multiple chunks in parallel (based
on [parallel-transform](https://www.npmjs.com/package/parallel-transform)). This is useful when transforming chunk is
slow (ie. async call to a database).

#### Options

| Name | Description  | Default value |Example |
| -------------| ------------- | ------------- |------------- |
| parallel | Number of chunks processed at the same time | 1  |`{ parallel: 1 }`  |
| * | The rest of the options is passed to `parallel-transform`  | `{ objectMode: true }`  |`{ highWaterMark: 32 }`  |

#### Examples

Transforming a number into an object

```js
const { oleoduc, transformData, writeData } = require("oleoduc");
const { Readable } = require("stream");

let source = Readable.from([1, 2]);

oleoduc(
  source,
  transformData((data) => {
    return ({ value: data });
  }),
  writeData((obj) => console.log(obj))
);

// --> Output:
{
  value: 1
}
{
  value: 2
}
```

### filterData

`filterData` allows data to be filtered (return false to ignore the current chunk).

Note that by default a chunk is processed just after the previous one has been pushed to the next step (sequentially).

This behaviour can be changed to filter multiple chunks in parallel (based
on [parallel-transform](https://www.npmjs.com/package/parallel-transform)). This is useful when filtering chunk is slow
.

#### Options

| Name | Description  | Default value |Example |
| -------------| ------------- | ------------- |------------- |
| parallel | Number of chunks processed at the same time | 1  |`{ parallel: 1 }`  |
| * | The rest of the options is passed to `parallel-transform`  | `{ objectMode: true }`  |`{ highWaterMark: 32 }`  |

#### Examples

Transforming a number into an object

```js
const { oleoduc, filterData, writeData } = require("oleoduc");
const { Readable } = require("stream");

let source = Readable.from([1, 2]);

oleoduc(
  source,
  filterData((data) => data === 1),
  writeData((obj) => console.log(obj))
);

// --> Output:
1
```

### writeData

`writeData` allows data to be written somewhere. Note that it must be the last step.

Note that by default a chunk is processed just after the previous one has been written (sequentially).

This behaviour can be changed to write multiple chunks in parallel. This is useful when writing chunk is slow (ie. async
call to a database).

#### Options

| Name | Description  | Default value |Example |
| -------------| ------------- | ------------- |------------- |
| parallel | Number of chunks processed at the same time | 1  |`{ parallel: 1 }`  |
| * | The rest of the options is passed to `stream.Writable`  | `{ objectMode: true }`  |`{ highWaterMark: 32 }`  |

#### Examples

Writing data to stdout

```js
const { oleoduc, writeData } = require("oleoduc");

oleoduc(
  source,
  writeData((data) => console.log("New chunk", data))
);
```

Writing data to a file

```js
const { oleoduc, writeData } = require("oleoduc");
const { createWriteStream } = require("fs");

await oleoduc(
  source,
  createWriteStream(file)
);
```

### accumulateData

`accumulateData` allows data to be accumulated before piping them to the next step. It can be used to reduce all the
data or to create group

#### Options

| Name  |Description| Default value |Example |
| -------------| ------------- | ------------- |------------- |
| accumulator  |Initial value of the accumulator| undefined  |`{ accumulator: [] }`  |
| * | The rest of the options is passed to `stream.Transform`  | `{ objectMode: true }`   |`{ highWaterMark: 32 }`  |

#### Examples

Reduce values from the source into a single string

```js
const { oleoduc, accumulateData, writeData } = require("oleoduc");
const { Readable } = require("stream");

let source = Readable.from(["j", "o", "h", "n"]);

oleoduc(
  source,
  accumulateData((acc, value) => {
    return { ...acc, value };
  }, { accumulator: "" }),
  writeData((acc) => console.log(acc))
);

// --> Output:
"john"
```

Group values from the source

```js
const { oleoduc, accumulateData, writeData } = require("oleoduc");
const { Readable } = require("stream");

let source = Readable.from(["John", "Doe", "Robert", "Hue"]);

oleoduc(
  source,
  accumulateData((array, value, flush) => {
    //Grouping firstname and lastname
    acc = [...acc, data];
    if (acc.length < 2) {
      return acc;
    } else {
      //flush and reset accumulator for the next group
      flush(acc.join(" "));
      return [];
    }

  }, { accumulator: [] }),
  writeData((array) => console.log(array))
);

// --> Output:
[
  "John Doe",
  "Robert Hue"
]
```

### flattenArray

`flattenArray` allows chunks of array to be streamed as if it were part of the source

#### Options

| Name  |Description| Default value |Example |
| -------------| ------------- | ------------- |------------- |
| * | The rest of the options is passed to `stream.Transform`  | `{ objectMode: true }`   |`{ highWaterMark: 32 }`  |

#### Examples

Flatten chunks

```js
const { oleoduc, flattenArray, writeData } = require("oleoduc");
const { Readable } = require("stream");

let source = Readable.from([["John Doe"], ["Robert Hue"]]);

oleoduc(
  source,
  flattenArray(),
  writeData((fullname) => console.log(fullname))
);

// --> Output:
"John Doe"
"Robert Hue"
```

### transformIntoJSON

`transformIntoJSON` allows data to be streamed as if it were a json array or a json object

#### Options

| Name  |Description| Default value |Example |
| -------------| ------------- | ------------- |------------- |
| arrayWrapper |The wrapper object| -  |`{ arrayWrapper: { value:"hello" } }`  |
| arrayPropertyName |The name of the array in the wrapper object| -  |`{ arrayPropertyName: "myArray" }`  |

#### Examples

Stream data as if it where a json array

```js
const { oleoduc, transformIntoJSON, writeData } = require("oleoduc");
const { Readable } = require("stream");

let source = Readable.from([{ user: "John Doe" }, { user: "Robert Hue" }]);

await oleoduc(
  source,
  transformIntoJSON(),
  writeData((json) => console.log(json))
);

// Json Output
'[{ user: "John Doe" }, { user: "Robert Hue" }]'

```

Stream data as if it where a json object

```js
const { oleoduc, transformIntoJSON, writeData } = require("oleoduc");
const { Readable } = require("stream");

let source = Readable.from([{ user: "John Doe" }, { user: "Robert Hue" }]);

await oleoduc(
  source,
  transformIntoJSON({ arrayWrapper: { other: "data" }, arrayPropertyName: "users" }),
  writeData((json) => console.log(json))
);

// Json Output
'{ other: "data", users: [{ user: "John Doe" }, { user: "Robert Hue" }] }'
```

### transformIntoCSV

`transformIntoCSV` allows data to be streamed as if it were a csv

#### Options

| Name  |Description| Default value |Example |
| -------------| ------------- | ------------- |------------- |
| separator |The separator between columns| `;`  |`{ separator: "|"}`  |
| columns |The list of columns with a mapper| keys of the object provided  |`{ columns: {name: (data) => data.toString()} }`  |

#### Examples

Stream data as if it where a csv

```js
const { oleoduc, transformIntoCSV } = require("oleoduc");
const { Readable } = require("stream");
const { createWriteStream } = require("fs");

let source = Readable.from([{ firstname: "John", lastname: "Doe" }, { firstname: "Robert", lastname: "Hue" }]);

await oleoduc(
  source,
  transformIntoCSV(),
  createWriteStream("/path/to/file")
);

// --> Output CSV file
`
firstName;lastname
John;Doe
Robert;Hue
`
```

Stream data as if it where a csv with custom columns

```js
const { oleoduc, transformIntoCSV } = require("oleoduc");
const { Readable } = require("stream");
const { createWriteStream } = require("fs");

let source = Readable.from([{ firstname: "John", lastname: "Doe" }, { firstname: "Robert", lastname: "Hue" }]);

await oleoduc(
  source,
  transformIntoCSV({
    sepatator: "|",
    columns: {
      fullname: (data) => `${data.firstName} ${data.lastName}`,
      date: () => new Date().toISOString(),
    },
  }),
  createWriteStream("/path/to/file")
);

// --> Output CSV file
`
fullname|date
John Doe|2021-03-12T21:34:13.085Z
Robert Hue|2021-03-12T21:34:13.085Z
`
```

### readLineByLine

`readLineByLine` allows data to be read line by line

#### Examples

Read a text file line by line

```js
const { oleoduc, readLineByLine, writeData } = require("oleoduc");
const { createReadStream } = require("stream");

//source file
let file = `
first line
second line
`

let output = [];
await oleoduc(
  createReadStream("/path/to/file.txt"),
  readLineByLine(),
  writeData((line) => output.push(line))
);

// --> Output:
[
  "first line",
  "second line"
]
```

Read a [ndsjon](http://ndjson.org/) file line by line

```js
const { oleoduc, readLineByLine, transformData, writeData } = require("oleoduc");
const { createReadStream } = require("stream");

//source ndjson file
let file = `
{"value":1}
{"value":2}
`

let output = [];
await oleoduc(
  createReadStream("/path/to/file.ndjson"),
  readLineByLine(),
  transformData(line => JSON.parse(line)),
  writeData((json) => output.push(json))
);

// --> Output:
[
  { value: 1 },
  { value: 2 },
]

```

## Misc

### Using nodejs stream API

Functions can be used on any nodejs stream:

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

### Async/Await

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

