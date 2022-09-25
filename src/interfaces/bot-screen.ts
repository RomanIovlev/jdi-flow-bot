import {BotButton} from './bot-button';

export interface BotScreen {
    command: string;
    description?: string;
    text?: string;
    image?: string | string[];
    data?: string;
    filter?: string;
    buttons?: BotButton[][];
    handler?: string;
    event?: string;
}
