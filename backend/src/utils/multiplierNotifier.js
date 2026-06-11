/**
 * multiplierNotifier.js
 * Sends notifications to recently active users about tomorrow's XP boost.
 */

const User = require("../models/user.model");
const Notification = require("../models/notification.model");
const { getTomorrowMultiplier } = require("./multiplierDay");

const sendMultiplierNotification = async () => {
    try {
        const tomorrow = getTomorrowMultiplier();
        if (tomorrow && tomorrow.active && tomorrow.multiplier > 1) {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

            // Find users active in the last 7 days who haven't already received an xp-boost notification today
            const startOfToday = new Date();
            startOfToday.setHours(0, 0, 0, 0);

            const usersWithNotificationToday = await Notification.find({
                type: "xp-boost",
                createdAt: { $gte: startOfToday }
            }).distinct("userId");

            const activeUsers = await User.find({
                lastActiveDate: { $gte: sevenDaysAgo },
                _id: { $nin: usersWithNotificationToday }
            });

            if (activeUsers.length === 0) {
                console.log("[Multiplier Notification] No active users needing notifications in the last 7 days.");
                return;
            }

            const notifications = activeUsers.map(user => ({
                userId: user._id,
                title: "Double XP Tomorrow! 🔥",
                message: `${tomorrow.reason} — Log in tomorrow and complete missions for bonus XP!`,
                type: "xp-boost",
                scheduledFor: new Date(),
                isRead: false
            }));

            await Notification.insertMany(notifications);
            console.log(`[Multiplier Notification] Sent tomorrow's XP boost notification to ${activeUsers.length} active users.`);
        } else {
            console.log("[Multiplier Notification] Tomorrow is not an active multiplier day. No notifications sent.");
        }
    } catch (error) {
        console.error("[Multiplier Notification] Failed to send daily multiplier notifications:", error.message);
    }
};

module.exports = { sendMultiplierNotification };
