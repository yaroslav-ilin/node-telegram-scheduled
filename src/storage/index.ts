import * as url from 'url';

import createPostgreSQL from './postgresql';
import createMongoDB from './mongodb';


// TODO: indices
export interface IStorage {
    count: (state?: PostState) => Promise<number>

    findById: (id: string) => Promise<IPost | null>
    findRandomReady: () => Promise<IPost | null>
    findEarliestScheduled: (limit?: number) => Promise<IPost[]>
    findLatestPosted: (limit?: number) => Promise<IPost[]>
    findLatestBanned: (limit?: number) => Promise<IPost[]>

    updateSetBanned: (id: string) => Promise<void>
    updateSetReady: (id: string) => Promise<void>
    updateSetScheduled: (id: string, date: Date) => Promise<void>
    updateSetPosted: (id: string, date: Date, reason: any) => Promise<void>
}

export interface IPost {
    id: string
    source: any
    state: PostState
    payload: IPayload
    time: Date
    reason: any
}

export enum PostState { ANY, BANNED, READY, SCHEDULED, POSTED }

// TODO: expand with other possible payloads
export type IPayload =
    IPhotoPayload    | IPhotoPayload[]   |
    IDocumentPayload | IDocumentPayload[]|
    any;

export interface IPhotoPayload {
    method: 'photo'
    params: {
        photo: string
        caption: string
    }
}
export interface IDocumentPayload {
    method: 'document'
    params: {
        document: string
        caption: string
    }
}

export default function createStorage(uri: string) {
    const schema = url.parse(uri).protocol!;

    switch(schema.substring(0, schema.length - 1)) {
    case 'postgres':
        return createPostgreSQL(uri);
    case 'mongodb':
        return createMongoDB(uri);
    default:
        throw TypeError('unknown storage requested "' + schema + '"');
    }
}
