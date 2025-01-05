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

- Easily transform, filter and write data flowing through the stream
- Catch stream errors
- Pipe and merge streams together
- Read a stream as if it were a promise

### Quick tour

Read a file, parse each line and store it into a database

```js
const { oleoduc, readLineByLine, transformData, writeData } = require("oleoduc");
const { createReadStream } = require("fs");

// Read a each line from a file, parse them as json and store document into MongoDB.
// No need to load all content into the memory
await oleoduc(
  createReadStream("/path/to/file"),
  readLineByLine(),
  transformData((line) => JSON.parse(line)),
  writeData((json) => db.insertOne(json)),
)
```

Stream JSON to client through an express server

```js
const express = require("express");
const { oleoduc, transformIntoJSON } = require("oleoduc");

// Consume for example a MongoDB cursor and send documents as it flows
const app = express();
app.get("/documents", async (req, res) => {
  oleoduc(
    db.collection("documents").find().stream(),
    transformIntoJSON(),// Stream the documents as a json array
    res
  );
});
```

Create a stream to parse CSV and iterate over it

```js
const { pipeStreams, transformData } = require("oleoduc");
const { createReadStream } = require("fs");
const { parse } = require("csv-parse");

const csvStream = pipeStreams(
  createReadStream("/path/to/file.csv"),
  parse(),
)

for await (const data of csvStream) {
  await db.insertOne(data)
}
```

# API

* [accumulateData](#accumulatedatacallback-options)
* [concatStreams](#concatstreamsstreams-options)
* [filterData](#filterdatacallback-options)
* [flattenArray](#flattenarrayoptions)
* [groupData](#groupdataoptions)
* [mergeStreams](#mergestreamsstreams-options)
* [oleoduc](#oleoducstreams-options)
* [pipeStreams](#pipestreamsstreams-options)
* [readLineByLine](#readlinebyline)
* [transformData](#transformdatacallback-options)
* [transformIntoCSV](#transformintocsvoptions)
* [transformIntoJSON](#transformintojsonoptions)
* [transformStream](#transformstreamoptions)
* [writeData](#writedatacallback-options)

## accumulateData(callback, [options])

Allows data to be accumulated before piping them to the next step. It can be used to reduce or group data

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

const source = Readable.from(["j", "o", "h", "n"]);

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

const source = Readable.from(["John", "Doe", "Robert", "Hue"]);

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

## concatStreams(...streams, [options])

Allows multiple streams to be processed one after the other.

#### Parameters

- `streams`: A list of streams or a function returning the next stream to process or `null` when no more streams
  available
- `options`: Options are passed to [stream.PassThrough](https://nodejs.org/api/stream.html#class-streampassthrough)

#### Examples

Read files as if it were a single one

```js
const { oleoduc, concatStreams, writeData } = require("oleoduc");
const { createReadStream } = require("stream");

const output = [];
await oleoduc(
  concatStreams(
    createReadStream("/path/to/file1.txt"),
    createReadStream("/path/to/file2.txt")
  ),
  writeData((line) => console.log(line))
)
;

```

Read files until no more available

```js
const { oleoduc, concatStreams, writeData } = require("oleoduc");
const { createReadStream } = require("stream");

async function next() {
  const fileName = await getFilenameFromAnAsyncFunction()
  return fileName ? createReadStream(fileName) : null;
}

const output = [];
await oleoduc(
  concatStreams(next),
  writeData((line) => console.log(line))
)
;
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

const source = Readable.from([1, 2]);

oleoduc(
  source,
  filterData((data) => data === 1),
  writeData((obj) => console.log(obj))
);

// --> Output:
1
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

const source = Readable.from([["John Doe"], ["Robert Hue"]]);

oleoduc(
  source,
  flattenArray(),
  writeData((fullname) => console.log(fullname))
);

// --> Output:
"John Doe"
"Robert Hue"
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

const source = Readable.from(["John", "Doe", "Robert", "Hue"]);

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

## mergeStreams(...streams, [options])

Allows chunks of multiple streams to be processed in no particular order.

#### Parameters

- `streams`: A list of streams
- `options`: Options are passed to [stream.PassThrough](https://nodejs.org/api/stream.html#class-streampassthrough)

#### Examples

Read files as if it were a single one

```js
const { oleoduc, mergeStreams, writeData } = require("oleoduc");
const { createReadStream } = require("stream");

const output = [];
await oleoduc(
  mergeStreams(
    createReadStream("/path/to/file1.txt"),
    createReadStream("/path/to/file2.txt")
  ),
  writeData((line) => console.log(line))
)
;
```

## oleoduc(...streams, [options])

Pipe streams together and returns a promisified stream.

It is same as nodejs
core [pipeline](https://nodejs.org/api/stream.html#stream_stream_pipeline_source_transforms_destination_callback) 
but with better error handling.

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

## pipeStreams(...streams, [options])

Pipe streams together and forwards errors

If the last stream is readable, the returned stream will be iterable

#### Parameters

- `streams`: A list of streams to pipe together
- `options`:
    - `*`: The rest of the options is passed
      to [stream.Transform](https://nodejs.org/api/stream.html#stream_class_stream_transform)

Pipe streams

```js
const { pipeStreams, transformData, writeData } = require("oleoduc");

async function getCursor() {
  const cursor = await getDataFromDB();
  return pipeStreams(
    cursor,
    transformData((data) => data.value * 10),
  )
};

const cursor = await getCursor();
await oleoduc(
  cursor,
  writeData((data) => console.log(data))
);
```

Iterate over a chained readable stream

```js
const { pipeStreams, transformData } = require("oleoduc");

const stream = pipeStreams(
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

const stream = pipeStreams(
  source,
  writeData((obj) => throw new Error())
);

stream.on("error", (e) => {
  //Handle error
});
```

## readLineByLine

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

const source = Readable.from([1, 2]);

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

const source = Readable.from([{ firstname: "John", lastname: "Doe" }, { firstname: "Robert", lastname: "Hue" }]);

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

const source = Readable.from([{ firstname: "John", lastname: "Doe" }, { firstname: "Robert", lastname: "Hue" }]);

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

const source = Readable.from([{ user: "John Doe" }, { user: "Robert Hue" }]);

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

const source = Readable.from([{ user: "John Doe" }, { user: "Robert Hue" }]);

await oleoduc(
  source,
  transformIntoJSON({ arrayWrapper: { other: "data" }, arrayPropertyName: "users" }),
  writeData((json) => console.log(json))
);

// Json Output
'{ other: "data", users: [{ user: "John Doe" }, { user: "Robert Hue" }] }'
```

## transformStream([options])

Allows chunks of a sub-stream to be streamed as if each was part of the source

#### Parameters

- `options`:
    - `*`: The rest of the options is passed
      to [stream.Transform](https://nodejs.org/api/stream.html#stream_class_stream_transform)

#### Examples

```js
const { oleoduc, transformStream, writeData } = require("oleoduc");
const { Readable } = require("stream");

const source = createStream();
source.push("House 1,House 2");
source.push(null);

await oleoduc(
  source,
  transformStream(data => {
    var array = getListOfPeopleLivingInTheHouse();
    return Readable.from(array); //Return a stream
  }),
  writeData((name) => console.log(name))
);

// --> Output:
"John Doe"
"John Doe Jr"
"Robert Hue"
"Robert Hue Jr"
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
