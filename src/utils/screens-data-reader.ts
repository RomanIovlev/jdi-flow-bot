import { BotTextImage } from '../interfaces/bot-text-image';
import fs from 'fs';
import { BotScreen } from '../interfaces/bot-screen';
import {logger} from './logger';

export class ScreensDataReader {
    protected data: BotTextImage[];

    constructor(protected screen: BotScreen, dataFolder: string) {
        this.data = JSON.parse(fs.readFileSync(dataFolder + this.screen.data).toString());
    }

    readData(): BotTextImage {
        logger.log('readData');
        if (this.data.length === 0) {
            console.error('Failed to load resource: ' + this.screen.data);
            return ;
        }
        if (this.screen.filter) {
            let filtered: BotTextImage[] = this.filter();
            if (filtered.length > 0) {
                this.data = filtered;
            }
        }
        return this.data[Math.floor(Math.random() * this.data.length)];
    }

    filter() {
        logger.log('filter');
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
        logger.log('filterEqual');
        const split = filter.split('=');
        // @ts-ignore
        return this.data.filter(r => this.compare(r[split[0]], split[1]));
    }
    filterMore(filter: string) {
        logger.log('filterMore');
        const split = filter.split('>');
        // @ts-ignore
        return this.data.filter(r => r[split[0]] > parseInt(split[1]));
    }
    filterLess(filter: string) {
        logger.log('filterLess');
        const split = filter.split('<');
        // @ts-ignore
        return this.data.filter(r => r[split[0]] < parseInt(split[1]));
    }

    compare(obj: any, str: string) {
        logger.log('compare');
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
