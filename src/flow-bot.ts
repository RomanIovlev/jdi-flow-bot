import {BotScreen} from './interfaces/bot-screen';
import TelegramBot, {Message, SendMessageOptions, SendPhotoOptions} from 'node-telegram-bot-api';
import fs from 'fs';
import {BotEvent} from './interfaces/bot-event';
import {FeedbackEvent} from './events/feedback-event';
import {ScreensResourceReader} from './utils/screens-resource-reader';
import {AdminEvents} from './events/admin-events';


export class FlowBot {
    readonly bot: TelegramBot;
    adminIds: number[] = [];
    screens: BotScreen[];
    events: BotEvent[];
    currentScreen: BotScreen;

    state: Map<number, string> = new Map<number, string>();

    constructor(token: string, flow: { screens: BotScreen[], events?: BotEvent[]}, options?: { adminIds: string | number[] }) {
        this.bot = new TelegramBot(token, {
            polling: true,
        });
        this.screens = flow.screens;
        this.events = flow.events ?? [];
        if (options?.adminIds) {
            this.adminIds = typeof options.adminIds !== 'string'
                ? options.adminIds
                : options.adminIds.split(';').map(id => parseInt(id));
        }
    }

    async start() {
        await this.registerCallbacks(this.screens);
        this.registerEvents(this.events);
        this.processScreen(this.screens[0]);
    }

    async restart(screens: BotScreen[], events: BotEvent[]) {
        this.screens = screens;
        this.events = events;
        this.bot.removeAllListeners();
        await this.start();
    }

    async registerCallbacks(screens: BotScreen[]) {
        const commands = [];
        for (const screen of screens) {
            if (screen.description) {
                commands.push({ command: screen.command, description: screen.description });
                this.bot.on('message', async ctx => {
                    if (ctx.text === screen.command) {
                        await this.processCommand(ctx, screen);
                    }
                });
            }
            this.bot.on('callback_query', async ctx => {
                this.currentScreen = screen;
                const command = '/' + ctx.data;
                if (command === screen.command) {
                    await this.processCommand(ctx.message, screen);
                }
            });
        }
        await this.bot.setMyCommands(commands);
    }

    async processCommand(ctx: Message, screen: BotScreen) {
        this.state.set(ctx.chat.id, '');
        await this.sendMessage(screen, ctx, screen.command);
        if (screen.event) {
            this.state.set(ctx.chat.id, screen.event);
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
}
