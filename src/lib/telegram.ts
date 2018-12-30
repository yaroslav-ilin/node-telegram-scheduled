import * as request from 'request';


export interface ITelegramPhoto {
    photo: string;
    caption: string;
}

export interface ITelegramDocument {
    document: string;
    caption: string;
}

export interface ITelegramMediaGroup {
    media: ITelegramMediaGroupPhoto[];
}

export interface ITelegramMediaGroupPhoto {
    type: 'photo';
    media: string;
}

type IAttachments = {[key: string]: request.Request};

export default class TelegramBot {
    constructor(
        protected token: string,
        protected chatId: string
    ) {}

    protected _request(endpoint: string, params: any) {
        return new Promise(function(resolve, reject) {
            request.post(endpoint, { formData: params, json: true }, function(error, response, body) {
                if (error) {
                    reject(error);
                } else if (body && !body.ok) {
                    // body:
                    // => error_code: 400
                    // => description: 'Bad Request: chat_id is empty'
                    reject(body);
                } else if (response.statusCode !== 200) {
                    reject(response);
                } else {
                    resolve(body.result);
                }
            });
        });
    }

    async sendPhoto(params: ITelegramPhoto): Promise<{}> {
        const payload = {
            ...params,
            chat_id: this.chatId,
            photo: request(params.photo),
            caption: params.caption || ''
        }
        return this._request('https://api.telegram.org/bot' + this.token + '/sendPhoto', payload);
    }

    async sendMediaGroup(params: ITelegramMediaGroup): Promise<{}> {
        const attachments = params.media.reduce((files, item, idx) => {
            files['attachment' + idx] = request(item.media);
            return files;
        }, {} as IAttachments);

        const payload = {
            ...params,
            chat_id: this.chatId,
            ...attachments,
            media: JSON.stringify(params.media.map((item, idx) => ({
                ...item,
                media: 'attach://attachment' + idx
            })))
        };

        return this._request('https://api.telegram.org/bot' + this.token + '/sendMediaGroup', payload);
    }

    async sendDocument(params: ITelegramDocument): Promise<{}> {
        const payload = {
            ...params,
            chat_id: this.chatId,
            document: request(params.document),
            caption: params.caption || ''
        }
        return this._request('https://api.telegram.org/bot' + this.token + '/sendDocument', payload);
    }
};
