import { Transform, TransformOptions } from "stream";

export type TransformIntoCSVOptions<TInput> = TransformOptions & {
  columns?: Record<string, (data: TInput) => Promise<AllowedCSVType> | AllowedCSVType>;
  bom?: boolean;
  mapper?: ValueMapper;
  separator?: string;
};
type AllowedCSVType = string | number;
type ValueMapper = (value: AllowedCSVType) => AllowedCSVType;

export function transformIntoCSV<TInput extends Record<string, unknown>>(
  options: TransformIntoCSVOptions<TInput> = {},
): Transform {
  const bom = options.bom;
  const separator = options.separator || ";";
  const columns = options.columns;
  const mapper: ValueMapper = options.mapper || ((v) => v);

  function generateColumnNames(chunk: TInput) {
    return Object.keys(columns || chunk)
      .map(mapper)
      .join(separator);
  }

  async function generateColumnValues(chunk: TInput) {
    let values: AllowedCSVType[];
    if (!columns) {
      values = Object.values(chunk) as AllowedCSVType[];
    } else {
      const columnNames = Object.keys(columns);
      values = await Promise.all(columnNames.map((name) => columns[name](chunk)));
    }

    return values.map(mapper).join(separator);
  }

  let lines = 0;
  return new Transform({
    objectMode: true,
    transform: async function (chunk: TInput, encoding, cb) {
      try {
        if (lines++ === 0) {
          if (bom) {
            this.push("\ufeff");
          }
          this.push(`${generateColumnNames(chunk)}\n`);
        }

        this.push(`${await generateColumnValues(chunk)}\n`);
        cb();
      } catch (e) {
        cb(e as Error);
      }
    },
  });
}
