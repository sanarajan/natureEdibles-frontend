import adminApiClient from '../adminApiClient';
import type { Notification } from './notificationApi';

export const getAdminNotifications = async () => {
    const response = await adminApiClient.get('/admin/notifications');
    return response.data;
};

export const markAdminNotificationAsRead = async (id: string) => {
    const response = await adminApiClient.put(`/admin/notifications/${id}/read`);
    return response.data;
};
