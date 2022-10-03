import {BotScreen} from './interfaces/bot-screen';
import TelegramBot, {Message, SendMessageOptions, SendPhotoOptions} from 'node-telegram-bot-api';
import fs from 'fs';
import {BotEvent} from './interfaces/bot-event';
import {FeedbackEvent} from './events/feedback-event';
import {ScreensDataReader} from './utils/screens-data-reader';
import {AdminEvents} from './events/admin-events';
import {logger} from './utils/logger';
import {LogLevels} from './utils/log-levels';
import {StatsHandler} from './stats/stats-handler';
import {mergePath} from './utils/file-utils';


export class FlowBot {
    readonly bot: TelegramBot;
    adminIds: number[] = [];
    screens: BotScreen[];
    events: BotEvent[];
    imagesFolder: string = './flow-bot/images/';
    dataFolder: string = './flow-bot/data/';

    screenDataReader: ScreensDataReader;
    state: Map<number, string> = new Map<number, string>();
    currentScreen: Map<number, BotScreen> = new Map<number, BotScreen>();
    stats: StatsHandler = new StatsHandler('./flow-bot/stats');

    constructor(token: string, flow: { screens: BotScreen[], events?: BotEvent[]}, options?: Partial<{
        adminIds: string | number[],
        dataFolder: string,
        logLevel: LogLevels,
    }>) {
        this.bot = new TelegramBot(token, {
            polling: true,
        });
        this.screens = flow.screens;
        this.events = flow.events ?? [];
        if (options) {
            if (options.adminIds) {
                this.adminIds = typeof options.adminIds !== 'string'
                    ? options.adminIds
                    : options.adminIds.split(';').map(id => parseInt(id));
            }
            if (options.dataFolder) {
                this.dataFolder = mergePath(options.dataFolder, 'data/');
                this.imagesFolder = mergePath(options.dataFolder, 'images/');
                this.stats = new StatsHandler(mergePath(options.dataFolder, 'stats/'));
            }
            if (options.logLevel) {
                logger.logLevel = options.logLevel;
            }
        }
    }

    start() {
        logger.debug('start');
        this.registerCommands(this.screens);
        this.registerEvents(this.events);
    }

    restart(screens: BotScreen[], events: BotEvent[]) {
        logger.debug('restart');
        this.screens = screens;
        this.events = events;
        this.bot.removeAllListeners();
        this.start();
    }

    registerCommands(screens: BotScreen[]) {
        logger.debug('registerCommands');
        try {
            const commands = [];
            for (const screen of screens) {
                logger.debug('register screen: ' + screen.command);
                if (screen.description) {
                    if (screen.command.includes('-')) {
                        logger.error(`Wrong command "${screen.command}". Dash (-) is not allowed for bot commands. See more details: https://core.telegram.org/bots/#commands`);
                    }
                    commands.push({command: screen.command, description: screen.description});
                    this.bot.on('message', async ctx => {
                        if (ctx.text === screen.command) {
                            await this.processCommand(ctx, screen);
                        }
                    });
                }
                this.bot.on('callback_query', async ctx => {
                    if ('/' + ctx.data === screen.command) {
                        await this.processCommand(ctx.message, screen);
                    }
                });
            }
            this.bot.setMyCommands(commands);
        } catch (ex: any) {
            logger.error('Register commands failed\n' + (ex.message || ex));
        }
    }

    async processCommand(ctx: Message, screen: BotScreen) {
        logger.debug('processCommand: ' + screen.command);
        this.stats.writeStats({ id: ctx.chat.username, screen: screen.command, date: new Date()});
        this.currentScreen.set(ctx.chat.id, screen);
        this.state.set(ctx.chat.id, '');
        await this.sendMessage(screen, ctx, screen.command);
        if (screen.event) {
            this.state.set(ctx.chat.id, screen.event);
        }
    }

    registerEvents(events: BotEvent[]) {
        logger.debug('registerEvents');
        new AdminEvents(this).register();
        for (const event of events) {
            logger.debug('register screen: ' + event.name);
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
        logger.debug('processEvent');
        if (event.feedback) {
            await new FeedbackEvent(this.bot, ctx, event.feedback).process();
        }
    }

    sendMessage(screen: BotScreen, ctx: TelegramBot.Message, command: string) {
        logger.debug('sendMessage');
        if (screen.data) {
            const item = this.getScreenDataReader(ctx.chat.id).readData(this.dataFolder + screen.data, screen.filter, screen.order);
            screen.text = item.text;
            screen.image = item.image;
        }
        return screen.image
            ? this.sendPhoto(screen, ctx, command)
            : this.sendText(screen, ctx, command);
    }

    getScreenDataReader(chatId: number): ScreensDataReader {
        this.screenDataReader = this.screenDataReader ?? new ScreensDataReader(chatId);
        return this.screenDataReader;
    }

    async sendText(screen: BotScreen, ctx: TelegramBot.Message, command: string) {
        let options: SendMessageOptions = { parse_mode: 'Markdown' };
        if (screen.buttons && screen.buttons.length > 0) {
            options.reply_markup = { inline_keyboard: screen.buttons };
        }
        if (!screen.command || command === screen.command) {
            const message = this.escapedText(screen.text);
            logger.debug('sendText: ' + message);
            await this.bot.sendMessage(ctx.chat.id, message, options);
            logger.debug('sendText successful');
        }
    }

    async sendPhoto(screen: BotScreen, ctx: TelegramBot.Message, command: string) {
        let options: SendPhotoOptions = {};
        if (screen.text) {
            options.caption = this.escapedText(screen.text);
            options.parse_mode = 'Markdown';
        }
        if (screen.buttons && screen.buttons.length > 0) {
            options.reply_markup = { inline_keyboard: screen.buttons };
        }
        if (screen.image && (!screen.command || command === screen.command)) {
            const imageFile = typeof screen.image === 'string'
                ? screen.image
                : screen.image[Math.floor(Math.random() * screen.image.length)];
            logger.debug(`sendPhoto: { image: ${imageFile}, text: ${options.caption}`);
            await this.bot.sendPhoto(ctx.chat.id, fs.readFileSync(this.imagesFolder + imageFile), options);
        }
        logger.debug('sendPhoto successful');
    }

    escapedText(text: string) {
        return text.replace('_', '\\_');
    }
}
