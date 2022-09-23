import {BotButton} from './bot-button';

export interface BotScreen {
    command: string;
    text?: string;
    image?: string | string[];
    resource?: string;
    filter?: string;
    buttons?: BotButton[][];
    handler?: string;
    event?: string;
}
