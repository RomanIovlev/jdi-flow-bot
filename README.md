# Flow bot

Is a simple framework for creating Telegram bots based on intuitive json flows
1. Add bot to your project using ```npm install --save-dev jdi-flow-bot```
2. Create json flow for your bot:
   ```flow = { screens: BotScreen[], events: BotEvent[] }```
3. Run flow bot using your json screen flow
```
import flow from './flow-bot/screens/flow.json';
import {FlowBot} from 'jdi-flow-bot/flow-bot';
import 'dotenv/config';

new FlowBot(process.env.BOT_TOKEN, flow).start();
```

Screen file example: 
```json
{
  "screens": [
    {
      "command": "/start",
      "description": "Start screen",
      "image": "start1.jpg",
      "text": "Hello world",
      "buttons": [
        [
          { "text": "Sun", "callback_data": "sun" }
        ],
        [
          { "text": "Sky", "callback_data": "sky" },
          { "text": "Water", "callback_data": "water" }
        ]
      ]
    },
    {
      "command": "/sun",
      "image": "sun.jpg",
      "text": "Some info about sun",
      "buttons": [ [ { "text":  "Back", "callback_data":  "start"} ] ]
    },
     {
        "command": "/sky",
        "image": "sky.jpg",
        "text": "Some info about sky",
        "buttons": [ [
           { "text":  "Sun", "callback_data":  "sun"},
           { "text":  "Back", "callback_data":  "start"}
        ] ]
     },
     {
        "command": "/water",
        "image": "water.jpg",
        "text": "Some info about water",
        "buttons": [ 
           [ { "text":  "Sky", "callback_data":  "sky"} ],
           [ { "text":  "Back", "callback_data":  "start"} ],
        ]
     }
  ],
  "events": [ ]
}
```
