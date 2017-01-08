export default class Conf {
    protected properties: Map<string, string>

    protected aliases: { [key: string]: string[] } = {
        'database.url': ['mongodb.url', 'mongodb.uri']
    }
    protected prefixes = [ 'openshift' ]

    constructor(env: { [key: string]: string }) {
        this.properties = Object.keys(env).reduce(function(props, item) {
            const path = item.toLowerCase().split('_').filter(Boolean).join('.');
            const value = env[item];
            if (value) {
                props.set(path, value);
            }
            return props;
        }, new Map<string, string>());
    }

    get(property: string) {
        if (this.properties.has(property)) {
            return this.properties.get(property)!;
        }
        if (this.aliases.hasOwnProperty(property)) {
            const aliases = this.aliases[property];
            for(let i = 0; i < aliases.length; i++) {
                if (this.properties.has(aliases[i])) {
                    return this.properties.get(aliases[i])!;
                }
            }
        }
        for(let i = 0; i < this.prefixes.length; i++) {
            const key = [this.prefixes[i], property].join('.');
            if (this.properties.has(key)) {
                return this.properties.get(key)!;
            }
        }
        throw new Error('could not find a value for property "' + property + '"');
    }
}
