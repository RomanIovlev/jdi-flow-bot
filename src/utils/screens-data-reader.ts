import { BotTextImage } from '../interfaces/bot-text-image';
import fs from 'fs';
import {logger} from './logger';
import {Order} from '../interfaces/bot-screen';

export class ScreensDataReader {
    previousData: Map<number, string[]> = new Map<number, string[]>([]);
    constructor(protected chatId: number) { }

    readData(dataPath: string, filter: string, order: Order): BotTextImage {
        logger.debug('readData');
        const data: BotTextImage[] = JSON.parse(fs.readFileSync(dataPath).toString());
        if (data.length === 0) {
            logger.error('Failed to load resource: ' + dataPath);
            return ;
        }
        let filtered: BotTextImage[] = filter
            ? this.filterAll(data, filter)
            : [...data];
        if (filtered.length > 1 && this.previousData.size > 0) {
            if (filtered.length === this.previousData.size) {
                this.previousData.set(this.chatId, []);
            } else {
                filtered = filtered.filter(d => !this.previousData.get(this.chatId).includes(d.text));
            }
        }
        const result = order === 'ordered'
            ? filtered[0]
            : filtered[Math.floor(Math.random() * filtered.length)];
        logger.debug('Filter result: ' + result);
        const newExclude: string[] = order === 'random'
            ? [...result.text]
            : [...this.previousData.get(this.chatId), result.text];
        this.previousData.set(this.chatId, newExclude);

        return result;
    }

    filterAll(data: BotTextImage[], filter: string): BotTextImage[] {
        const conditions: string[] = filter.includes('&')
            ? filter.split('&')
            : [...filter];
        let filtered: BotTextImage[] = [...data];
        for(let condition of conditions) {
            filtered = this.filter(filtered, condition);
        }
        return filtered;
    }

    filter(data: BotTextImage[], filter: string): BotTextImage[]  {
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

    filterEqual(data: BotTextImage[], filter: string): BotTextImage[] {
        const split = filter.split('=');
        logger.debug('filterEqual: ' + JSON.stringify(split));
        // @ts-ignore
        return data.filter(r => this.compare(r[split[0]], split[1]));
    }
    filterMore(data: BotTextImage[], filter: string): BotTextImage[] {
        logger.debug('filterMore');
        const split = filter.split('>');
        // @ts-ignore
        return data.filter(r => r[split[0]] > parseInt(split[1]));
    }
    filterLess(data: BotTextImage[], filter: string): BotTextImage[] {
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
