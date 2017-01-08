import * as request from 'request';


export interface ITelegramPhoto {
    photo: string
    caption: string
}

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
        const payload = Object.assign({}, params, { chat_id: this.chatId });
        if (!payload.caption) {
            delete payload.caption;
        }
        return this._request('https://api.telegram.org/bot' + this.token + '/sendPhoto', payload);
    }
};
