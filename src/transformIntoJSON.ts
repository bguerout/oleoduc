import {Transform, TransformOptions} from "stream";

export type TransformIntoJSONOptions = TransformOptions & {
    arrayPropertyName?: string;
    arrayWrapper?: Record<string, unknown>;
};
const DEFAULT_ARRAY_PROPERTY_NAME = "items";

export function transformIntoJSON<TInput>(options: TransformIntoJSONOptions = {}): Transform {
    let chunksSent = 0;
    return new Transform({
        readableObjectMode: false,
        writableObjectMode: true,
        transform: function (chunk: TInput, encoding, callback) {
            const shouldWrap = options.arrayWrapper || options.arrayPropertyName;
            if (chunksSent === 0) {
                if (shouldWrap) {
                    let value = JSON.stringify(options.arrayWrapper || {});
                    value = value.substring(0, value.length - 1);
                    const comma = options.arrayWrapper ? "," : "";
                    value += String(`${comma}"${options.arrayPropertyName || DEFAULT_ARRAY_PROPERTY_NAME}":[`);
                    this.push(value);
                } else {
                    this.push("[");
                }
            }

            if (chunksSent++ > 0) {
                this.push(",");
            }

            this.push(JSON.stringify(chunk));
            callback();
        },
        flush: function (callback) {
            const shouldWrap = options.arrayWrapper || options.arrayPropertyName;

            if (chunksSent === 0) {
                //nothing sent
                if (shouldWrap) {
                    const value = options.arrayWrapper || {};
                    value[options.arrayPropertyName || DEFAULT_ARRAY_PROPERTY_NAME] = [];
                    this.push(JSON.stringify(value));
                } else {
                    this.push("[]");
                }
            } else {
                //Close json properly
                this.push("]");
                if (shouldWrap) {
                    this.push("}");
                }
            }
            return callback();
        },
    });
}
