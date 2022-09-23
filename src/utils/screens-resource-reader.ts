import { BotTextImage } from '../interfaces/bot-text-image';
import fs from 'fs';
import { BotScreen } from '../interfaces/bot-screen';

export class ScreensResourceReader {
    protected resource: BotTextImage[];

    constructor(protected screen: BotScreen) {
        this.resource = JSON.parse(fs.readFileSync(this.screen.resource).toString());
    }

    readResource(): BotTextImage {
        if (this.resource.length === 0) {
            console.error('Failed to load resource: ' + this.screen.resource);
            return ;
        }
        if (this.screen.filter) {
            let filtered: BotTextImage[] = this.filter();
            if (filtered.length > 0) {
                this.resource = filtered;
            }
        }
        return this.resource[Math.floor(Math.random() * this.resource.length)];
    }

    filter() {
        try {
            if (this.screen.filter.includes('=')) {
                return this.filterEqual(this.screen.filter);
            }
            if (this.screen.filter.includes('>')) {
                return this.filterMore(this.screen.filter);
            }
            if (this.screen.filter.includes('<')) {
                return this.filterLess(this.screen.filter);
            }
            return [];
        } catch (ex) { return []; }
    }

    filterEqual(filter: string) {
        const split = filter.split('=');
        // @ts-ignore
        return this.resource.filter(r => this.compare(r[split[0]], split[1]));
    }
    filterMore(filter: string) {
        const split = filter.split('>');
        // @ts-ignore
        return this.resource.filter(r => r[split[0]] > parseInt(split[1]));
    }
    filterLess(filter: string) {
        const split = filter.split('<');
        // @ts-ignore
        return this.resource.filter(r => r[split[0]] < parseInt(split[1]));
    }

    compare(obj: any, str: string) {
        if (typeof obj === 'string') {
            return obj === str;
        }
        if (typeof obj === 'number') {
            return obj === parseInt(str);
        }
        if (typeof obj === 'boolean') {
            return obj === (str === 'true');
        }
    }
}
