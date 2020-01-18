require("dotenv").config();
const Eris = require("eris");
const eventHandler = require("./bot/eventHandler");

const { DISCORD_TOKEN } = process.env;

const bot = new Eris(DISCORD_TOKEN, {
    getAllUsers: true,
    disableEvents: ['TYPING_START'],
    maxShards: 'auto',
    messageLimit: 1
});

bot.connect();

eventHandler(bot);
