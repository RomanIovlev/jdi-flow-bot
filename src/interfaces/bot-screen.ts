import {BotButton} from './bot-button';

export type Order = 'random' | 'ordered' | 'random-excluding';

export interface BotScreen {
    command: string;
    description?: string;
    text?: string;
    image?: string | string[];
    data?: string;
    order?: Order;
    filter?: string;
    buttons?: BotButton[][];
    handler?: string;
    event?: string;
}
