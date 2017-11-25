import * as mongodb from 'mongodb';

import { lazy } from '../lib/util';
import { IStorage, PostState, IPost } from '.';


export default function createStorage(uri: string) {
    const _mongodb: typeof mongodb = require('mongodb');
    const collection = lazy<Promise<mongodb.Collection>>(
        () => _mongodb.MongoClient.connect(uri).then(db => db.collection('posts'))
    );

    function idify(post: IPost & {_id: string}): IPost {
        const rv = Object.assign({}, {
            id: post._id,
            time: post.time,
            state: post.state,
            reason: post.reason,
            source: post.source,
            payload: post.payload
        }, post);
        delete rv._id;
        return rv;
    }

    const storage: IStorage = {
        async count (state = PostState.ANY) {
            const posts = await collection();
            return posts.count(state === PostState.ANY ? {} : { state: PostState[state!] });
        },

        async findById (id): Promise<IPost | null> {
            const posts = await collection();
            return posts.findOne({ _id: id }).then(idify);
        },

        async findRandomReady (): Promise<IPost | null> {
            const total = await storage.count(PostState.READY);
            if (0 === total) {
                return null;
            }
            const posts = await collection();
            return posts.findOne(
                { state: PostState[PostState.READY] },
                { skip: getRandomInt(0, total - 1) }
            ).then(idify);
        },

        async findEarliestScheduled (limit = 1): Promise<IPost[]> {
            const posts = await collection();
            return posts
                .find({ state: PostState[PostState.SCHEDULED] })
                .sort({ time: 1 })
                .limit(limit!)
                .toArray()
                .then(posts => posts.map(idify));
        },

        async findLatestPosted (limit = 1): Promise<IPost[]> {
            const posts = await collection();
            return posts
                .find({ state: PostState[PostState.POSTED] })
                .sort({ time: -1 })
                .limit(limit!)
                .toArray()
                .then(posts => posts.map(idify));
        },

        async findLatestBanned (limit = 1): Promise<IPost[]> {
            const posts = await collection();
            return posts
                .find({ state: PostState[PostState.BANNED] })
                .sort({ time: -1 })
                .limit(limit!)
                .toArray()
                .then(posts => posts.map(idify));
        },


        async updateSetBanned (postId: string) {
            const posts = await collection();
            await posts.update({ _id: postId }, {
                $set: { state: PostState[PostState.BANNED], time: new Date() }
            });
        },

        async updateSetReady (postId: string) {
            const posts = await collection();
            await posts.update({ _id: postId }, { $set: { state: PostState[PostState.READY] } });
        },

        async updateSetScheduled (postId: string, scheduledTime: Date) {
            const posts = await collection();
            await posts.update({ _id: postId }, {
                $set: { state: PostState[PostState.SCHEDULED], time: scheduledTime }
            });
        },

        async updateSetPosted (postId: string, postedTime: Date, reason: any) {
            const posts = await collection();
            await posts.update({ _id: postId }, {
                $set: { state: PostState[PostState.POSTED], time: postedTime, reason: reason }
            });
        }
    };

    return storage;
}

function getRandomInt(min: number, max: number) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
