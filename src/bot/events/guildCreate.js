const GuildModel = require("../../mongooseModels/GuildModel");
const checkPremiumGuilds = require("../utils/checkPremiumGuilds");

const regionRelation = {
    brazil: "pt_BR"
};
module.exports = (client, guild) => {
    checkPremiumGuilds(client);
    //set language for the guild based on its voice region
    if (regionRelation[guild.region]) {
        GuildModel.findOneAndUpdate(
            { guild_id: guild.id },
            { lang: regionRelation[guild.region] },
            { upsert: true }
        )
            .exec()
            .catch(console.error);
    }
}