import * as services from '../application';
import { IPayload } from '../storage';


export default async function run() {
    const store = services.store();
    const [ queued ] = await store.findEarliestScheduled();

    const now = new Date();
    now.setUTCMinutes(now.getUTCMinutes() + 1);
    if (!queued || queued.time > now) {
        console.warn('Nothing to Post. Exiting.');
        return;
    }

    const reason = await post(queued.payload);
    await store.updateSetPosted(queued.id, new Date(), reason);

    console.log(JSON.stringify({
        id: queued.id,
        time: new Date().toISOString(),
        reason
    }));
}

async function post(payload: IPayload): Promise<{}[] | {}> {
    if (Array.isArray(payload)) {
        return Promise.all(payload.map(post));
    } else {
        switch(payload.method) {
        case 'photo':
            return services.telegram().sendPhoto(payload.params);
        case 'document':
            return services.telegram().sendDocument(payload.params);
        default:
            throw new TypeError('unsupported method "' + payload.method + '"');
        }
    }
}
