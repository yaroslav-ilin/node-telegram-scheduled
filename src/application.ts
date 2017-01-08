import * as url from 'url';

import { lazy } from './lib/util';
import { createHoursIteratorWithOffsetOf } from './lib/intervals';
import Conf from './lib/conf';
import Telegram from './lib/telegram';
import { default as createStorage, IStorage } from './storage';


const defaultDatabaseName = 'posts';

export interface IApplication {
    env: any
}

class Application implements IApplication {
    constructor(
        public env = process.env
    ) {}
}

const app: IApplication = new Application();
export default app;

export const conf = lazy(() => new Conf(app.env));

export const store: () => IStorage = lazy(function () {
    const connection = url.parse(conf().get('database.url'));
    if ('/' === connection.pathname) {
        connection.pathname += defaultDatabaseName;
    }
    return createStorage(url.format(connection));
});

export const every2Hours = lazy(function() {
    const every2Hours = createHoursIteratorWithOffsetOf(2);
    let startingFrom;
    try {
        startingFrom = parseInt(conf().get('repost.start.hour'), 10);
    } catch(e) {
        startingFrom = 10;
    }
    return every2Hours(startingFrom);
});

export const telegram = lazy(() => new Telegram(conf().get('telegram.token'), conf().get('telegram.chatid')));
