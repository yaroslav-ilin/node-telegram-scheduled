export function createHoursIteratorWithOffsetOf(offset: number) {
    var currentIterationDate = new Date();

    return function*(startHour: number) {
        currentIterationDate.setUTCHours(startHour);
        currentIterationDate.setUTCMinutes(0);
        currentIterationDate.setUTCSeconds(0);
        currentIterationDate.setUTCMilliseconds(0);
        if (currentIterationDate < new Date()) {
            currentIterationDate.setUTCDate(currentIterationDate.getUTCDate() + 1);
        }

        while(true) {
            const date = new Date(currentIterationDate);
            currentIterationDate.setUTCHours(currentIterationDate.getUTCHours() + offset);
            yield date;
        }
    };
}
