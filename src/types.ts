export type AnyStream = NodeJS.ReadableStream | NodeJS.WritableStream | NodeJS.ReadWriteStream;

export type PipeableStreams<TFirstStream extends AnyStream, TLastStream extends AnyStream, TOptions extends object> =
    | [first: TFirstStream]
    | [first: TFirstStream, last: TLastStream]
    | [first: TFirstStream, ...streams: NodeJS.ReadWriteStream[], last: TLastStream]
    | [first: TFirstStream, ...streams: NodeJS.ReadWriteStream[], last: TLastStream, options: TOptions];
