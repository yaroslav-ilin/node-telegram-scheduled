import * as pgPromise from 'pg-promise';

import { IStorage, PostState, IPost } from '.';


export default function createStorage(uri: string): IStorage {
    const _pgPromise: typeof pgPromise = require('pg-promise');

    const pgp = _pgPromise<pgPromise.IMain>();
    const db = pgp(uri);
    const table = 'posts';

    const storage: IStorage = {
        count: async function(state = PostState.ANY) {
            const where = state === PostState.ANY ? '' : ' WHERE state = $1';

            return db.oneOrNone('SELECT count(id) FROM ' + table + where, [ PostState[state!] ])
                .then(result => parseInt(result.count, 10));
        },


        findById: async function(id) {
            return db.oneOrNone('SELECT * FROM ' + table + ' WHERE id = $1', [ id ]);
        },

        findRandomReady: async function(): Promise<IPost | null> {
            const total = await storage.count(PostState.READY);
            if (0 === total) {
                return null;
            }
            const query = 'SELECT * FROM ' + table + ' WHERE state = $1 ORDER BY id OFFSET $2 LIMIT 1';
            return db.oneOrNone(query, [ PostState[PostState.READY], getRandomInt(0, total - 1) ]);
        },

        findEarliestScheduled: async function(limit = 1): Promise<IPost[]> {
            const query = 'SELECT * FROM ' + table + ' WHERE state = $1 ORDER BY time ASC LIMIT $2';
            return db.manyOrNone(query, [ PostState[PostState.SCHEDULED], limit ]);
        },

        findLatestPosted: async function(limit = 1): Promise<IPost[]> {
            const query = 'SELECT * FROM ' + table + ' WHERE state = $1 ORDER BY time DESC LIMIT $2';
            return db.manyOrNone(query, [ PostState[PostState.POSTED], limit ]);
        },

        findLatestBanned: async function(limit = 1): Promise<IPost[]> {
            const query = 'SELECT * FROM ' + table + ' WHERE state = $1 ORDER BY time DESC LIMIT $2';
            return db.manyOrNone(query, [ PostState[PostState.BANNED], limit ]);
        },


        updateSetBanned: async function(postId: string) {
            return db.none('UPDATE ' + table + ' SET time = $2, state = $3 WHERE id = $1',
                [ postId, new Date(), PostState[PostState.BANNED] ]
            );
        },

        updateSetReady: async function(postId: string) {
            return db.none('UPDATE ' + table + ' SET state = $2 WHERE id = $1',
                [ postId, PostState[PostState.READY] ]
            );
        },

        updateSetScheduled: async function(postId: string, scheduledTime: Date) {
            return db.none('UPDATE ' + table + ' SET time = $2, state = $3 WHERE id = $1',
                [ postId, scheduledTime, PostState[PostState.SCHEDULED] ]
            );
        },

        updateSetPosted: async function(postId: string, postedTime: Date, reason: any) {
            return db.none(
                'UPDATE ' + table + ' SET time = $2, reason = $3:json, state = $4 WHERE id = $1',
                [ postId, postedTime, reason, PostState[PostState.POSTED] ]
            );
        }
    };

    return storage;
}

function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
