# Flow bot

Is a simple framework for creating Telegram bots based on intuitive json flows
1. Add bot to your project using ```npm install --save-dev jdi-flow-bot```
2. Create json flow for your bot:
flow = { screens: BotScreen[], events: BotEvent[] }
3. Run flow bot using your json screen flow
```
import {FlowBot} from './flowbot/flow-bot';
import flow from './resources/screens-flow.json';

new FlowBot(flow).start();
```
