import {StatRecord} from './stat-record';
import {getDate} from '../utils/date-utils';
import {Periods} from '../utils/periods';
import fs from 'fs';
import csv from 'fast-csv';

export class StatsHandler {
    readonly filePath: string = './src/stats/stats.csv';

    csvToData() {
        const result: StatRecord[] = [];
        fs.createReadStream(this.filePath)
            .pipe(csv.parse({ headers: true }))
            .on('error', error => console.error(error))
            .on('data', row => result.push(row));
        console.log('CSV: ', JSON.stringify(result));
        return result;
    }
    //fs.readFile(this.filePath, 'utf8', (err, data) => {
    /* parse data */

    stats: StatRecord[];

    readStats(filter: (stat: StatRecord) => boolean = st => true): StatRecord[] {
        const stats: StatRecord[] = JSON.parse(fs.readFileSync(this.filePath).toString());
        return stats.filter(filter);
    }

    writeStats(stat: StatRecord) {
        this.stats.push(stat);
    }

    getAllUsers(stats: StatRecord[] = this.readStats()): string[] {
        const users: string[] = [];
        for (let stat of stats) {
            if (!users.includes(stat.id)) {
                users.push(stat.id);
            }
        }
        return users;
    }

    getUsersCount(stats: StatRecord[] = this.readStats()): number {
        return this.getAllUsers(stats).length;
    }

    getUsersCountInRange(from: Date, to: Date): number {
        return this.getUsersCount(this.readStats().filter(stat => stat.date > from && stat.date < to));
    }

    getUsersCountWithShift(shift: Periods): number {
        return this.getUsersCountInRange(new Date(), getDate(shift));
    }

    getUsersLastWeek(): number {
        return this.getUsersCountWithShift({ week: -1});
    }

    getUsersLastMonth(): number {
        return this.getUsersCountWithShift({ month: -1});
    }

    getNewUsersCount(shift: Periods): number {
        const oldUsers: string[] = this.getAllUsers(this.readStats().filter(stat => stat.date < getDate(shift)));
        const newUsers: string[] = this.getAllUsers(this.readStats().filter(stat => stat.date >= getDate(shift)));
        return newUsers.filter(user => !oldUsers.includes(user)).length;
    }

    getNewUsersLastWeek(): number {
        return this.getNewUsersCount({ week: -1 })
    }

    getNewUsersLastMonth(): number {
        return this.getNewUsersCount({ month: -1 })
    }

    getActionsCount(action: string, shift: Periods = {}): number {
        return this.readStats().filter(stat => stat.screen === action && stat.date >= getDate(shift)).length;
    }

    getActionsLastWeek(action: string) {
        return this.getActionsCount(action, { week: -1 });
    }

    getActionsLastMonth(action: string) {
        return this.getActionsCount(action, { month: -1 });
    }
}
