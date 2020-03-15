const updateCounter = require("../utils/updateCounter");

module.exports = (client, guild, member) => {
    
    const guildCounts = client.guildsCounts.get(guild.id);

    guildCounts.increment("members", 1);

    if (member.user.bot) guildCounts.increment("bots", 1);
    else guildCounts.increment("users", 1);

    updateCounter({client, guildSettings: member.guild.id});
};