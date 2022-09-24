# Flow bot

Is a simple framework for creating Telegram bots based on intuitive json flows
1. Add bot to your project using ```npm install --save-dev jdi-flow-bot```
2. Create json flow for your bot:
   ```flow = { screens: BotScreen[], events: BotEvent[] }```
3. Run flow bot using your json screen flow
```
import flow from './resources/screens-flow.json';
import {FlowBot} from './jdi-flow-bot/flow-bot';
import 'dotenv/config';

new FlowBot(process.env.BOT_TOKEN, flow).start();
```
