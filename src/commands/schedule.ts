import * as services from '../application';
import { IPost } from '../storage';


export default async function run() {
    const store = services.store();
    let amount;
    try {
        amount = parseInt(services.conf().get('repost.amount'), 10);
    } catch(e) {
        amount = 3;
    }

    const queue: IPost[] = [];
    while (queue.length < amount) {
        const randomPost = await store.findRandomReady();
        if (!randomPost) {
            break;
        }
        if (queue.map(p => p.id).indexOf(randomPost.id) < 0) {
            queue.push(randomPost);
        }
    }
    if (queue.length > 0) {
        console.log(queue.map(p => p.id).join(', '));
    } else {
        console.warn('Nothing to Schedule. Exiting.');
    }
    while (queue.length > 0) {
        await store.updateSetScheduled(queue.shift()!.id, services.every2Hours().next().value);
    }
}
