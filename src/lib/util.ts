export function lazy<T>(init: (...args: Object[]) => T) {
    let _cache: T | null = null;
    return function(...args: Object[]) {
        if (!_cache) {
            _cache = init(...args);
        }
        return _cache;
    }
}

export function promisify<T>(fn: (...a: any[]) => any, context: Object) {
    return async function(...args: any[]) {
        return new Promise<T>(function(resolve, reject) {
            fn.apply(context, args.concat([function(err: any, result: T) {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            }]));
        });
    };
}
