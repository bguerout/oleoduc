import {accumulateData, AccumulateDataOptions} from "./accumulateData";

export type GroupDataOptions<TInput> = {size?: number} & AccumulateDataOptions<Array<TInput>>;

export function groupData<TInput>(options: GroupDataOptions<TInput> = {}): NodeJS.ReadWriteStream {
    return accumulateData<TInput, Array<TInput>, Array<TInput>>(
        (acc, data, flush) => {
            const group = [...acc, data];
            const groupSize = options.size || 1;
            if (group.length === groupSize) {
                flush(group);
                return [];
            } else {
                return group;
            }
        },
        {...options, accumulator: []},
    );
}
