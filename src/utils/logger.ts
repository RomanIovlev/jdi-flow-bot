import {LogLevels} from './log-levels';

export class Logger {
    constructor(protected logLevel: LogLevels = LogLevels.off) { }
    log(message: string) {
        if (this.logLevel === LogLevels.off) return;
        console.log(message);
    }
    error(message: string) {
        if (this.logLevel !== LogLevels.errors) return;
        console.error(message);
    }
}
export const logger = new Logger();
