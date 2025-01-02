type Args<TParams, TOptions> = {
  params: TParams[];
  options: TOptions;
};

export function parseArgs<TParams, TOptions extends object>(
  args: [...params: TParams[]] | [...params: TParams[], options: TOptions],
  defaults?: Partial<TOptions>,
): Args<TParams, TOptions> {
  const last = args[args.length - 1];

  let options = {};
  if (isOption(last)) {
    options = args.pop() as TOptions;
  }

  return {
    params: (Array.isArray(args[0]) ? args[0] : args) as TParams[],
    options: {
      objectMode: true,
      ...defaults,
      ...options,
    } as TOptions,
  };
}

function isOption<TOptions>(last: unknown): last is TOptions {
  return Boolean(
    last &&
      typeof last === "object" &&
      !Array.isArray(last) &&
      typeof (last as Record<string, unknown>).pipe !== "function",
  );
}
