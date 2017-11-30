import * as url from 'url';
import * as http from 'http';

import * as services from './application';
import { PostState, IPost } from './storage';


const server = http.createServer(async function(req: http.IncomingMessage, res: http.ServerResponse) {
    const location = url.parse(req.url!);
    const pathnames = location.pathname!.substring(1).split('/');

    try {
        switch(pathnames[0]) {
        case 'dashboard.json':
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(JSON.stringify(await dashboard()));
            break;
        case 'dump':
            const post = await dump(pathnames.slice(1));
            if (post) {
                res.setHeader('Access-Control-Allow-Origin', '*');
                res.end(JSON.stringify(post));
            } else {
                sendNotFound(res);
            }
            break;
        default:
            sendNotFound(res);
            break;
        }
    } catch(e) {
        console.error(e);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: 'Error', message: 'Something Went Wrong' }));
    }
});

async function dashboard() {
    function strip(post: IPost) {
        return {
            id: post.id,
            time: post.time,
            state: post.state,
            reason: post.reason,
            payload: post.payload
        };
    }

    const store = services.store();
    const [ total, readyCount, scheduledCount, bannedCount, scheduled, posted, banned ] = await Promise.all([
        store.count(),
        store.count(PostState.READY),
        store.count(PostState.SCHEDULED),
        store.count(PostState.BANNED),
        store.findEarliestScheduled(100),
        store.findLatestPosted(10),
        store.findLatestBanned(10)
    ]);

    return {
        counts: {
            total,
            ready: readyCount,
            scheduled: scheduledCount,
            banned: bannedCount
        },
        scheduled: scheduled.map(strip),
        posted: posted.map(strip),
        banned: banned.map(strip)
    };
}

async function dump([ id, ...path ]: string[]) {
    if (!id) {
        return null;
    }
    const store = services.store();
    const post = await store.findById(id);
    if (!post) {
        return null;
    }
    if (path.length > 0) {
        return path.reduce(function(rv: {[key: string]: any}, path) {
            if (!rv) {
                return null;
            }
            return rv[path];
        }, post);
    }
    return post;
}

function sendNotFound(res: http.ServerResponse) {
    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Error', message: 'Entity Not Found' }));
}

export default server;
