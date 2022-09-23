import TelegramBot from 'node-telegram-bot-api';

export class FeedbackEvent {
    constructor(protected bot: TelegramBot, protected ctx: TelegramBot.Message, protected feedback: BotEventFeedback) { }

    async process() {
        const text = this.feedback.textTemplate
            ? this.feedback.textTemplate.replace('{{text}}', this.ctx.text)
            : this.ctx.text;
        await this.bot.sendMessage(this.feedback.chatId, text, {parse_mode: 'Markdown'});
    }
}
