# oleoduc

oleoduc (french synonym of pipeline) provides tools to easily stream data.

```sh
npm install oleoduc
# or
yarn add oleoduc
```

It can be used with both CommonJS and ESM

```sh
const { ... } = require("oleoduc");
# or
import { ... } from "oleoduc";
```

[![NPM](https://img.shields.io/npm/v/oleoduc.svg)](https://www.npmjs.com/package/oleoduc)
![ci](https://github.com/bguerout/oleoduc/actions/workflows/ci.yml/badge.svg)
[![codecov](https://codecov.io/gh/bguerout/oleoduc/branch/master/graph/badge.svg?token=BVLPFRCPRH)](https://codecov.io/gh/bguerout/oleoduc)

## Getting started

### Features

- Transform, filter, reduce and group data during stream processing
- Compose and merge streams together
- Read a stream as if it were a promise

### Quick tour

Read a file, parse each line and store it into a database

```js
const { oleoduc, readLineByLine, transformData, writeData } = require("oleoduc");
const { createReadStream } = require("fs");

// Wait until all lines have been inserted.
// No need to load all content into the memory
await oleoduc(
  createReadStream("/path/to/file"),
  readLineByLine(),
  transformData((line) => JSON.parse(line)),
  writeData((json) => db.insertOne(json)),
)
```

Compose streams and iterate over it

```js
const { compose, readLineByLine, transformData } = require("oleoduc");
const { createReadStream } = require("fs");

//Same as the previous example but with composition and for loop
let stream = compose(
  createReadStream("/path/to/file"),
  readLineByLine(),
  transformData((line) => JSON.parse(line)),
)

for await (const json of stream) {
  await db.insertOne(json)
}
```

Stream JSON to client through an express server

```js
const express = require("express");
const { oleoduc, transformIntoJSON } = require("oleoduc");

// Consume for example a MongoDB cursor and send documents as it flows
const app = express();
app.get("/documents", async (req, res) => {
  oleoduc(
    db.collection("documents").find(),
    transformIntoJSON(),// Stream the documents as a json array
    res
  );
});
```

# API

## oleoduc(...streams, [options])

Pipe streams together, forwards errors and returns a promisified stream.

It is same as nodejs
core [pipeline](https://nodejs.org/api/stream.html#stream_stream_pipeline_source_transforms_destination_callback) but
with better error handling and stream composition capability.

If the last stream is readable, the returned stream will be iterable

#### Parameters

- `streams`: A list of streams to pipe together
- `options`:
    - `promisify`: Make returned stream also a promise (default: `true`)
    - `*`: The rest of the options is passed
      to [stream.Transform](https://nodejs.org/api/stream.html#stream_class_stream_transform)

#### Examples

Create an oleoduc and wait for stream to be consumed

```js
const { oleoduc, writeData } = require("oleoduc");

await oleoduc(
  source,
  writeData((obj) => console.log(obj))
);
```

Handle errors

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

## compose(...streams, [options])

Same as oleoduc but without promise stuff.

#### Parameters

- `streams`: A list of streams to pipe together
- `options`:
    - `*`: The rest of the options is passed
      to [stream.Transform](https://nodejs.org/api/stream.html#stream_class_stream_transform)

Compose streams

```js
const { compose, transformData, writeData } = require("oleoduc");

async function getSource() {
  let cursor = await getDataFromDB();
  return compose(
    cursor,
    transformData((data) => data.value * 10),
  )
};

let source = await getSource();
await oleoduc(
  source,
  writeData((data) => console.log(data))
);
```

Iterate over a composed readable stream

```js
const { compose, transformData } = require("oleoduc");

let stream
compose(
  source,
  transformData((data) => data.trim()),
);

for await (const data of stream) {
  console.log(data)
}

```

Handle errors in single event listener

```js
const { oleoduc, writeData } = require("oleoduc");

let stream = compose(
  source,
  writeData((obj) => throw new Error())
);

stream.on("error", (e) => {
  //Handle error
});

```

## transformData(callback, [options])

Allows data to be manipulated and transformed during a stream processing.

Note that by default a chunk is processed when the previous one has been pushed to the next step (sequentially).

This behaviour can be changed to transform multiple chunks in parallel (based
on [parallel-transform](https://www.npmjs.com/package/parallel-transform)). This is useful when transforming chunk is
slow (ie. async call to a database).

#### Parameters

- `callback`: a function with signature `function(data)` that must return the transformed data or null to ignored it.
  Note that the returned value can be a promise.
- `options`:
    - `parallel`: Number of chunks processed at the same time (default: 1)
    - `*`: The rest of the options is passed
      to [parallel-transform](https://github.com/mafintosh/parallel-transform#stream-options)

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

## filterData(callback, [options])

Allows data to be filtered (return false to ignore the current chunk).

Note that by default a chunk is processed when the previous one has been pushed to the next step (sequentially).

This behaviour can be changed to filter multiple chunks in parallel (based
on [parallel-transform](https://www.npmjs.com/package/parallel-transform)). This is useful when filtering chunk is slow
.

#### Parameters

- `callback`: a function with signature `function(data)` that must return false to ignore a chunk.
  Note that the returned value can be a promise.
- `options`:
    - `parallel`: Number of chunks processed at the same time (default: 1)
    - `*`: The rest of the options is passed
      to [parallel-transform](https://github.com/mafintosh/parallel-transform#stream-options)

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

## writeData(callback, [options])

Allows data to be written somewhere. Note that it must be the last step.

Note that by default a chunk is processed when the previous one has been written (sequentially).

This behaviour can be changed to write multiple chunks in parallel. This is useful when writing chunk is slow (ie. async
call to a database).

#### Parameters

- `callback`: a function with signature `function(data)` to write the data. Note that the returned value can be a
  promise.
- `options`:
    - `parallel`: Number of chunks processed at the same time (default: 1)
    - `*`: The rest of the options is passed
      to [stream.Writable](https://nodejs.org/api/stream.html#stream_class_stream_writable)

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

## accumulateData(callback, [options])

Allows data to be accumulated before piping them to the next step. It can be used to reduce the data or to create group

#### Parameters

- `callback`: a function with signature `function(acc, data, flush)` that must return the accumulated data (can be a
  promise). Call `flush` to push the data accumulated yet;
- `options`:
    - `accumulator`: Initial value of the accumulator (default: undefined)
    - `*`: The rest of the options is passed
      to [stream.Transform](https://nodejs.org/api/stream.html#stream_class_stream_transform)

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

Group values into an array

```js
const { oleoduc, accumulateData, writeData } = require("oleoduc");
const { Readable } = require("stream");

let source = Readable.from(["John", "Doe", "Robert", "Hue"]);

oleoduc(
  source,
  accumulateData((acc, data, flush) => {
    //Group firstname and lastname
    acc = [...acc, data];
    if (acc.length < 2) {
      //Accumulate data until we have firstname and lastname
      return acc;
    } else {
      //flush the group
      flush(acc.join(" "));
      //Reset accumulator for the next group
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

## groupData([options])

A pre-built accumulator to group data into an array (without the need to flush)

#### Parameters

- `options`:
    - `size`: The number of elements in each group

#### Examples

```js
const { oleoduc, groupData, writeData } = require("oleoduc");
const { Readable } = require("stream");

let source = Readable.from(["John", "Doe", "Robert", "Hue"]);

oleoduc(
  source,
  groupData({ size: 2 }),
  writeData((array) => console.log(array))
);

// --> Output:
[
  "John Doe",
  "Robert Hue"
]
```

## flattenArray([options])

Allows chunks of an array to be streamed as if each was part of the source

#### Parameters

- `options`:
    - `*`: The rest of the options is passed
      to [stream.Transform](https://nodejs.org/api/stream.html#stream_class_stream_transform)

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

## flattenStream([options])

Convert chunk into a stream and consumes it

#### Parameters

- `options`:
    - `*`: The rest of the options is passed
      to [stream.Transform](https://nodejs.org/api/stream.html#stream_class_stream_transform)

#### Examples

Stream data as if it where a json array

```js
const { oleoduc, flattenStream, writeData } = require("oleoduc");
const { Readable } = require("stream");

let source = Readable.from(["John Doe", "Robert Hue"]);

await oleoduc(
  source,
  transformData(data => {
    return createAStream(data);
  }),
  flattenStream(),
  writeData((json) => console.log(json))
);

// Json Output
'[{ user: "John Doe" }, { user: "Robert Hue" }]'
```

## readLineByLine()

Allows data to be read line by line

#### Examples

Read a [ndsjon](http://ndjson.org/) file line by line

```js
const { oleoduc, readLineByLine, transformData, writeData } = require("oleoduc");
const { createReadStream } = require("stream");

await oleoduc(
  createReadStream("/path/to/file.ndjson"),
  readLineByLine(),
  transformData(line => JSON.parse(line)),
  writeData((json) => console.log(json))
);
```

## mergeStreams([options])

Allows multiple streams to be merged into a single one. The returned stream will be an iterator.

#### Parameters

- `options`:
    - `sequential`: Read the next stream after the previous one has ended (default: false)

#### Examples

Read multiple files as if it were a single one

```js
const { oleoduc, mergeStreams, writeData } = require("oleoduc");
const { createReadStream } = require("stream");

let output = [];
await oleoduc(
  mergeStreams(
    createReadStream("/path/to/file1.txt"),
    createReadStream("/path/to/file2.txt")
  ),
  writeData((line) => console.log(line))
)
;
```

Read multiple files sequentially and iterate over the merged stream

```js
const { oleoduc, mergeStreams, writeData } = require("oleoduc");
const { createReadStream } = require("stream");

let stream = mergeStreams(
  createReadStream("/path/to/file1.txt"),
  createReadStream("/path/to/file2.txt"),
  { sequential: true }
);

for await (const data of stream) {
  console.log(data)
}


```

## transformIntoJSON([options])

Allows data to be streamed as if it were a json string

#### Parameters

- `options`:
    - `arrayWrapper`: The wrapper object
    - `arrayPropertyName`: The json property name of the array

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

Stream data as if it where a json object with an array property inside

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

## transformIntoCSV([options])

Allows data to be streamed as if it were a csv

#### Parameters

- `options`:
    - `separator`: The separator between columns (default : `;`)
    - `columns`: An object to map each column (default: the keys of the object)
    - `mapper`: A function with signature `function(value)` that must return the value of the current cell

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

Stream data as if it where a csv with options

```js
const { oleoduc, transformIntoCSV } = require("oleoduc");
const { Readable } = require("stream");
const { createWriteStream } = require("fs");

let source = Readable.from([{ firstname: "John", lastname: "Doe" }, { firstname: "Robert", lastname: "Hue" }]);

await oleoduc(
  source,
  transformIntoCSV({
    sepatator: "|",
    mapper: (v) => `"${v || ''}"`,//Values will be enclosed in double quotes
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
