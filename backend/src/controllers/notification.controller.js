/**
 * notification.controller.js
 * Manages notifications — fetch, read, create, delete.
 */

const Notification = require("../models/notification.model");
const { sendSuccess, sendError } = require("../utils/responseHelper");

// @route   GET /api/notifications
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .limit(50);

        const unreadCount = notifications.filter((n) => !n.isRead).length;

        return sendSuccess(res, 200, "Notifications fetched.", { notifications, unreadCount });
    } catch (error) {
        return sendError(res, 500, "Failed to fetch notifications.");
    }
};

// @route   PUT /api/notifications/:id/read
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, userId: req.user._id },
            { isRead: true },
            { returnDocument: "after" }
        );
        if (!notification) return sendError(res, 404, "Notification not found.");
        return sendSuccess(res, 200, "Marked as read.", notification);
    } catch (error) {
        return sendError(res, 500, "Failed to mark notification as read.");
    }
};

// @route   PUT /api/notifications/read-all
const markAllAsRead = async (req, res) => {
    try {
        await Notification.updateMany({ userId: req.user._id, isRead: false }, { isRead: true });
        return sendSuccess(res, 200, "All notifications marked as read.");
    } catch (error) {
        return sendError(res, 500, "Failed to mark all as read.");
    }
};

// @route   DELETE /api/notifications/:id
const deleteNotification = async (req, res) => {
    try {
        await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
        return sendSuccess(res, 200, "Notification deleted.");
    } catch (error) {
        return sendError(res, 500, "Failed to delete notification.");
    }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification };
