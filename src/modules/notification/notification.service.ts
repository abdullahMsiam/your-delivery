import { prisma } from "../../lib/prisma.js";
import AppError from "../../utils/AppError.js";

type GetNotificationsQuery = {
  page: number;
  limit: number;
};

type CreateNotificationInput = {
  userId: string;
  type:
    | "DELIVERY_ASSIGNED"
    | "DELIVERY_STATUS_UPDATED"
    | "DELIVERY_DELIVERED"
    | "DELIVERY_CANCELLED"
    | "PAYMENT_PAID"
    | "PAYMENT_FAILED"
    | "COD_PAYMENT_RECEIVED";
  title: string;
  message: string;
};

const getMyNotifications = async (
  userId: string,
  query: GetNotificationsQuery,
) => {
  const { page, limit } = query;

  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: {
        userId,
      },
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.notification.count({
      where: {
        userId,
      },
    }),
  ]);

  return {
    data: notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getUnreadCount = async (userId: string) => {
  const count = await prisma.notification.count({
    where: {
      userId,
      isRead: false,
    },
  });

  return {
    unreadCount: count,
  };
};

const markAsRead = async (notificationId: string, userId: string) => {
  const notification = await prisma.notification.findFirst({
    where: {
      id: notificationId,
      userId,
    },
  });

  if (!notification) {
    throw new AppError(404, "Notification not found");
  }

  if (notification.isRead) {
    return notification;
  }

  return prisma.notification.update({
    where: {
      id: notificationId,
    },
    data: {
      isRead: true,
    },
  });
};

const markAllAsRead = async (userId: string) => {
  const result = await prisma.notification.updateMany({
    where: {
      userId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });

  return {
    updatedCount: result.count,
  };
};

const createNotification = async (data: CreateNotificationInput) => {
  return prisma.notification.create({
    data: {
      userId: data.userId,
      type: data.type,
      title: data.title,
      message: data.message,
    },
  });
};

export const notificationService = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  createNotification, 
};
