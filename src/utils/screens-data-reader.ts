import { BotTextImage } from '../interfaces/bot-text-image';
import fs from 'fs';
import {logger} from './logger';

export class ScreensDataReader {
    previousData: Map<number, string> = new Map<number, string>();
    constructor(protected chatId: number) { }

    readData(dataPath: string, filter: string): BotTextImage {
        logger.debug('readData');
        const data: BotTextImage[] = JSON.parse(fs.readFileSync(dataPath).toString());
        if (data.length === 0) {
            logger.error('Failed to load resource: ' + dataPath);
            return ;
        }
        let filtered: BotTextImage[] = filter
            ? this.filter(data, filter)
            : [...data];
        if (this.previousData && filtered.length > 1) {
            const newFilter = filtered.filter(d => d.text !== this.previousData.get(this.chatId));
            if (newFilter.length > 0) {
                filtered = [...newFilter];
            }
        }
        const result = filtered[Math.floor(Math.random() * filtered.length)];
        logger.debug('Filter result: ' + result);
        this.previousData.set(this.chatId, result.text);
        return result;
    }

    filter(data: BotTextImage[], filter: string) {
        logger.debug('filter');
        try {
            if (filter.includes('=')) {
                return this.filterEqual(data, filter);
            }
            if (filter.includes('>')) {
                return this.filterMore(data, filter);
            }
            if (filter.includes('<')) {
                return this.filterLess(data, filter);
            }
            return [];
        } catch (ex) { return []; }
    }

    filterEqual(data: BotTextImage[], filter: string) {
        const split = filter.split('=');
        logger.debug('filterEqual: ' + JSON.stringify(split));
        // @ts-ignore
        return data.filter(r => this.compare(r[split[0]], split[1]));
    }
    filterMore(data: BotTextImage[], filter: string) {
        logger.debug('filterMore');
        const split = filter.split('>');
        // @ts-ignore
        return data.filter(r => r[split[0]] > parseInt(split[1]));
    }
    filterLess(data: BotTextImage[], filter: string) {
        logger.debug('filterLess');
        const split = filter.split('<');
        // @ts-ignore
        return data.filter(r => r[split[0]] < parseInt(split[1]));
    }

    compare(obj: any, str: string): boolean {
        if (!obj) return false;
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
