import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';

export class FeedbackEvent {
    constructor(protected bot: TelegramBot, protected ctx: TelegramBot.Message, protected feedback: BotEventFeedback) { }

    async process() {
        if (this.ctx.photo) {
            await this.resendPhoto();
        } else {
            await this.resendText();
        }
    }

    async resendPhoto() {
        if (!fs.existsSync('temp')) {
            await fs.mkdirSync('temp');
        }
        const filePath = await this.bot.downloadFile(this.ctx.photo[this.ctx.photo.length - 1].file_id, 'temp');
        await this.bot.sendPhoto(this.feedback.chatId, fs.readFileSync(filePath), {
                caption: this.getText(this.ctx.caption),
                parse_mode: 'Markdown'
            });
        fs.rmdirSync('temp', { recursive: true });
    }

    async resendText() {
        const text = this.getText(this.ctx.text);
        await this.bot.sendMessage(this.feedback.chatId, text, { parse_mode: 'Markdown' });
    }

    getText(text: string): string {
        const message = text || '';
        return this.feedback.textTemplate
            ? this.feedback.textTemplate.replace('{{text}}', message).replace('{{from}}', this.ctx.from.username)
            : message;
    }
}
