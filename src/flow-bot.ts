import {BotScreen} from './interfaces/bot-screen';
import TelegramBot, {SendMessageOptions, SendPhotoOptions} from 'node-telegram-bot-api';
import fs from 'fs';
import {BotEvent} from './interfaces/bot-event';
import {FeedbackEvent} from './events/feedback-event';
import {ScreensResourceReader} from './utils/screens-resource-reader';
import 'dotenv/config';
import {AdminEvents} from './events/admin-events';


export class FlowBot {
    readonly bot: TelegramBot = new TelegramBot(process.env.BOT_TOKEN, {
        polling: true,
    });
    screens: BotScreen[];
    events: BotEvent[];

    state: Map<number, string> = new Map<number, string>();

    constructor(flow: { screens: BotScreen[], events: BotEvent[]}) {
        this.screens = flow.screens;
        this.events = flow.events;
    }

    start() {
        this.processScreen(this.screens[0])
        this.registerCallbacks(this.screens);
        this.registerEvents(this.events);
    }

    restart(screens: BotScreen[], events: BotEvent[]) {
        this.screens = screens;
        this.events = events;
        this.bot.removeAllListeners();
        this.start();
    }

    processScreen(screen: BotScreen) {
        if (!screen.text && !screen.image && !screen.resource) {
            console.error('Screen must have at least text or image or resource');
            return ;
        }
        this.bot.on('message', ctx => this.sendMessage(screen, ctx, ctx.text));
    }

    sendMessage(screen: BotScreen, ctx: TelegramBot.Message, command: string) {
        if (screen.resource) {
            const item = new ScreensResourceReader(screen).readResource();
            screen.text = item.text;
            screen.image = item.image;
        }
        return screen.image
            ? this.sendPhoto(screen, ctx, command)
            : this.sendText(screen, ctx, command);
    }

    async sendText(screen: BotScreen, ctx: TelegramBot.Message, command: string) {
        let options: SendMessageOptions = { parse_mode: 'Markdown' };
        if (screen.buttons && screen.buttons.length > 0) {
            options.reply_markup = { inline_keyboard: screen.buttons };
        }
        if (!screen.command || command === screen.command) {
            await this.bot.sendMessage(ctx.chat.id, screen.text, options);
        }
    }

    async sendPhoto(screen: BotScreen, ctx: TelegramBot.Message, command: string) {
        let options: SendPhotoOptions = {};
        if (screen.text) {
            options.caption = screen.text;
            options.parse_mode = 'Markdown';
        }
        if (screen.buttons && screen.buttons.length > 0) {
            options.reply_markup = { inline_keyboard: screen.buttons };
        }
        if (!screen.command || command === screen.command) {
            const imageFile = typeof screen.image === 'string'
                ? screen.image
                : screen.image[Math.floor(Math.random() * screen.image.length)]
            await this.bot.sendPhoto(ctx.chat.id, fs.readFileSync('./images/' + imageFile), options);
        }
    }

    registerCallbacks(screens: BotScreen[]) {
        for (const screen of screens) {
            this.bot.on('callback_query', async ctx => {
                const command = '/' + ctx.data;
                if (command && command === screen.command) {
                    this.state.set(ctx.message.chat.id, '');
                    await this.sendMessage(screen, ctx.message, command);
                    if (screen.event) {
                        this.state.set(ctx.message.chat.id, screen.event);
                    }
                }
            });
        }
    }

    registerEvents(events: BotEvent[]) {
        new AdminEvents(this).register();
        for (const event of events) {
            const screen = this.screens.find(sc => sc.command === event.command);
            if (!screen) return;
            this.bot.on('message', async ctx =>  {
                if (this.state.get(ctx.chat.id) !== event.name) return;
                await this.processEvent(ctx, event);
                this.state.set(ctx.chat.id, '');
                await this.sendMessage(screen, ctx, screen.command);
            });
        }
    }

    async processEvent(ctx: TelegramBot.Message, event: BotEvent) {
        if (event.feedback) {
            await new FeedbackEvent(this.bot, ctx, event.feedback).process();
        }
    }
}
