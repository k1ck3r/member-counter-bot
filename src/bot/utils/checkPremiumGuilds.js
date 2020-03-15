const PREMIUM_BOT = process.env.PREMIUM_BOT ? JSON.parse(process.env.PREMIUM_BOT) : false;
const fetchGuildSettings = require('./fetchGuildSettings');

module.exports = (client) => {
    if (PREMIUM_BOT) {
        client.guilds.forEach((guild) => {
            fetchGuildSettings(guild.id)
                .then((guildSettings) => {
                    if (guildSettings.premium_status < 2) {
                        client.leaveGuild(guild.id).catch(console.error);
                    }
                })
                .catch(console.error);
        });
    }
};
