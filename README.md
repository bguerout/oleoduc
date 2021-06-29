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

let source = Readable.from(["Huge", "List", "..."]);

await oleoduc(
  source,
  transformData((data) => data.toLowerCase()),
  writeData((data) => console.log(data)),
)
```

## Real life examples:

Stream documents to client through an express server

```js
const express = require("express");
const { oleoduc, transformIntoJSON } = require("oleoduc");

// No need to load all the documents into the memory. 
// Consume for example a MongoDB cursor and send documents as it flows
const app = express();
app.get("/documents", async (req, res) => {
  oleoduc(
    db.collection("documents").find(),
    transformIntoJSON(),
    res
  );
});
```

Import file into database

```js
const { oleoduc, readLineByLine, transformData, writeData } = require("oleoduc");
const { createReadStream } = require("fs");

// No need to load all file content into the memory. 
// Stream lines and save them as it flows
await oleoduc(
  createReadStream("/path/to/file"),
  readLineByLine(),
  transformData((line) => JSON.parse(line)),
  writeData((json) => db.insertOne(json)),
)
```

# API

## oleoduc(...streams, [options])

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

Create an oleoduc and handle errors in single event listener

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

## transformData(callback, [options])

Allows data to be manipulated and transformed during a stream processing.

Note that by default a chunk is processed just after the previous one has been pushed to the next step (sequentially).

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

Note that by default a chunk is processed just after the previous one has been pushed to the next step (sequentially).

This behaviour can be changed to filter multiple chunks in parallel (based
on [parallel-transform](https://www.npmjs.com/package/parallel-transform)). This is useful when filtering chunk is slow
.

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

Note that by default a chunk is processed just after the previous one has been written (sequentially).

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

Allows data to be accumulated before piping them to the next step. It can be used to reduce the data or
to create group

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

Group values

```js
const { oleoduc, accumulateData, writeData } = require("oleoduc");
const { Readable } = require("stream");

let source = Readable.from(["John", "Doe", "Robert", "Hue"]);

oleoduc(
  source,
  accumulateData((group, data, flush) => {
    //Group firstname and lastname
    group = [...group, data];
    if (group.length < 2) {
      //Accumulate data until we have a group with firstname and lastname
      return group;
    } else {
      //flush the group
      flush(group.join(" "));
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

A pre-built accumulator to create group of data

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

Allows chunks of array to be streamed as if it were part of the source

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
    - `doubleQuotes`: If true column names and values will be enclosed in double quotes (default: true)

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

## readLineByLine()

Allows data to be read line by line

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
