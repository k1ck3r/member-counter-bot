const addTrack = require("../addTrack");
const buildTopicCounter = require("./functions/buildTopicCounter");
const setChannelName = require("./functions/setChannelName");
const removeChannelFromDB = require("./functions/removeChannelFromDB");
const { getConnectedUsers } = require("../guildsCounts/fetchCounts");

const previousCounts = new Map();

/**
 * @param {(Object|string)} guildSettings Mongoose GuildModel or Discord guild id
 * @param {Boolean} force Skips queue and updates all counters 
 */
module.exports = async ({ client, guildSettings, force = false }) => {
    const { guildsCounts } = client;
    const {
        guild_id,
        channelNameCounters,
        topicCounterChannels,
        mainTopicCounter
    } = guildSettings;

    //check if there is any counter enabled to continue or just break
    if (channelNameCounters.size === 0 && topicCounterChannels.size === 0) return;

    const guild = client.guilds.get(guild_id);
    const guildCount = guildsCounts.get(guild_id);

    if (guild && !guild.unavailable) {
        let currentCount, previousCount;

        if (!force && previousCounts.has(guild_id)) { 
            currentCount = guildCount.counts;
            previousCount = previousCounts.get(guild_id);
        } else {
            previousCounts.delete(guild_id);
            currentCount = guildCount.counts;
            previousCount = {};
            force = true;
        }
        
        //get banned members
        currentCount.bannedMembers = 0;

        if (
            Array.from(channelNameCounters).some((channel) => channel[1].type === "bannedmembers")
            || Array.from(topicCounterChannels).some((channel) => /\{bannedMembers\}/i.test(channel[1].topic))
            || /\{bannedMembers\}/i.test(mainTopicCounter)
        ) {
            await guild.getBans()
            .then(bans => currentCount.bannedMembers = bans.length)
            .catch(error => {        
                channelNameCounters.forEach((channelNameCounter, channelId) => {
                    if (channelNameCounter.type === "bannedmembers") {
                        client.guilds.get(guild_id)
                            .channels.get(channelId)
                                .delete().catch(console.error);

                        removeChannelFromDB({
                            client,
                            guildSettings,
                            channelId,
                            type: "channelNameCounter",
                            error
                        });
                    }
                })
            });
        }

        currentCount.connectedUsers = getConnectedUsers(client, guild_id);
    
        //used to check if tracks are already added or not to avoid duplicates
        let isTrackAlreadyAdded = {
            onlineMembers: false,
            members: false,
            bannedMembers: false,
            roles: false,
            channels: false,
            connectedUsers: false

        };

        //set counts
        //channelName counters:
        channelNameCounters.forEach((channelNameCounter, channelId) => {
            let { channelName, type } = channelNameCounter;
            switch (type) {
                case "users":
                    if (previousCount.users !== currentCount.users)
                        setChannelName({ client, channelId, channelName, count: currentCount.users, guildSettings });
                    break;

                case "bots":
                    if (previousCount.bots !== currentCount.bots)
                        setChannelName({ client, channelId, channelName, count: currentCount.bots, guildSettings });
                    break;

                case "onlinemembers":
                    if (previousCount.onlineMembers !== currentCount.onlineMembers) {
                        setChannelName({ client, channelId, channelName, count: currentCount.onlineMembers, guildSettings });
                        if (!isTrackAlreadyAdded.onlineMembers) {
                            addTrack(guild_id, "online_member_count_history", currentCount.onlineMembers);
                            isTrackAlreadyAdded.onlineMembers = true;
                        }
                    }
                    break;

                case "onlineusers":
                    if (previousCount.onlineUsers !== currentCount.onlineUsers)
                        setChannelName({ client, channelId, channelName, count: currentCount.onlineUsers, guildSettings });
                    break;

                case "onlinebots":
                    if (previousCount.onlineBots !== currentCount.onlineBots)
                        setChannelName({ client, channelId, channelName, count: currentCount.onlineBots, guildSettings });
                    break;

                case "offlinemembers":
                    if (previousCount.offlineMembers !== currentCount.offlineMembers)
                        setChannelName({ client, channelId, channelName, count: currentCount.offlineMembers, guildSettings });
                    break;

                case "offlineusers":
                    if (previousCount.offlineUsers !== currentCount.offlineUsers)
                        setChannelName({ client, channelId, channelName, count: currentCount.offlineUsers, guildSettings });
                    break;
                
                case "offlinebots":
                    if (previousCount.offlineBots !== currentCount.offlineBots)
                        setChannelName({ client, channelId, channelName, count: currentCount.offlineBots, guildSettings });
                    break;
                
                case "members":
                case undefined:
                    if (previousCount.members !== currentCount.members) {
                        if (!isTrackAlreadyAdded.members) {
                            addTrack(guild_id, "member_count_history", currentCount.members);
                            isTrackAlreadyAdded.members = true;
                        }
                        setChannelName({ client, channelId, channelName, count: currentCount.members, guildSettings });
                    }
                    break;

                case "bannedmembers":
                    if (previousCount.bannedMembers !== currentCount.bannedMembers) {
                        if (!isTrackAlreadyAdded.bannedMembers) {
                            addTrack(guild_id, "banned_member_count_history", currentCount.bannedMembers);
                            isTrackAlreadyAdded.bannedMembers = true;
                        }
                        setChannelName({ client, channelId, channelName, count: currentCount.bannedMembers, guildSettings });
                    }
                    break;

                case "connectedusers":
                    if (previousCount.connectedUsers !== currentCount.connectedUsers) {
                        if (!isTrackAlreadyAdded.connectedUsers) {
                            addTrack(guild_id, "vc_connected_members_count_history", currentCount.connectedUsers);
                            isTrackAlreadyAdded.connectedUsers = true;
                        }
                        setChannelName({ client, channelId, channelName, count: currentCount.connectedUsers, guildSettings });
                    }
                    break;

                case "channels":
                    if (previousCount.channels !== currentCount.channels) {
                        if (!isTrackAlreadyAdded.channels) {
                            addTrack(guild_id, "channel_count_history", currentCount.channels);
                            isTrackAlreadyAdded.channels = true;
                        }
                        setChannelName({ client, channelId, channelName, count: currentCount.channels, guildSettings });
                    }
                    break;

                case "roles":
                    if (previousCount.roles !== currentCount.roles) {
                        if (!isTrackAlreadyAdded.roles) {
                            addTrack(guild_id, "role_count_history", currentCount.roles);
                            isTrackAlreadyAdded.roles = true;
                        }
                        setChannelName({ client, channelId, channelName, count: currentCount.roles, guildSettings });
                    }
                    break;

                case "memberswithrole":
                    let count = new Map();
                    let targetRoles = channelNameCounter.otherConfig.roles;

                    targetRoles.forEach((targetRole) => {
                        guild.members.forEach((member) => {
                            if (member.roles.includes(targetRole)) count.set(member.id);
                        });
                    })
                    

                    addTrack(guild_id, "memberswithrole_count_history", count.size, { channelId });

                    setChannelName({ client, channelId, channelName: channelNameCounter.channelName, count: count.size, guildSettings });
                    break;
            }
        });

        //topicCounters:
        const formatTopic = (topic) => {
            return topic
                .replace(/\{members\}|\{count\}/gi, buildTopicCounter(guildSettings, currentCount.members))
                .replace(/\{onlineMembers\}/gi, buildTopicCounter(guildSettings, currentCount.onlineMembers))
                .replace(/\{offlineMembers\}/gi, buildTopicCounter(guildSettings, currentCount.offlineMembers))
                .replace(/\{users\}/gi, buildTopicCounter(guildSettings, currentCount.users))
                .replace(/\{onlineUsers\}/gi, buildTopicCounter(guildSettings, currentCount.onlineUsers))
                .replace(/\{offlineUsers\}/gi, buildTopicCounter(guildSettings, currentCount.offlineUsers))
                .replace(/\{bots\}/gi, buildTopicCounter(guildSettings, currentCount.bots))
                .replace(/\{onlineBots\}/gi, buildTopicCounter(guildSettings, currentCount.onlineBots))
                .replace(/\{offlineBots\}/gi, buildTopicCounter(guildSettings, currentCount.offlineBots))
                .replace(/\{bannedMembers\}/gi, buildTopicCounter(guildSettings, currentCount.bannedMembers))
                .replace(/\{channels\}/gi, buildTopicCounter(guildSettings, currentCount.channels))
                .replace(/\{roles\}/gi, buildTopicCounter(guildSettings, currentCount.roles))
                .replace(/\{connectedUsers\}/gi, buildTopicCounter(guildSettings, currentCount.connectedUsers))
                .slice(0, 1023);
        }
        let globalTopicCounterFormatted = formatTopic(mainTopicCounter);

            topicCounterChannels.forEach((topicCounterChannel, channelId) => {
                const channel = guild.channels.get(channelId);
                //exists the channel?
                if (channel) {
                    //is text type or news type?
                    if (channel.type === 0 || channel.type === 5) {
    
                        //the topic must be the main one or a specific one?
                        let topicToSet = (topicCounterChannel.topic) ? topicCounterChannel.topic : globalTopicCounterFormatted;
    
                        topicToSet = formatTopic(topicToSet);
    
                        channel
                            .edit({
                                topic: topicToSet
                            })
                            .catch(error => {
                                removeChannelFromDB({ client, guildSettings, error, channelId, type: "topicCounter" });
                                console.error(error);
                            });
                    }
                } else {
                    removeChannelFromDB({
                        client,
                        guildSettings,
                        channelId,
                        type: "topicCounter", 
                        forceRemove: true
                    });
                }
            });

        //cache counts to check in a future if its necessary to update the channel name and the topic
        previousCounts.set(guild_id, {...currentCount});
    }
};
