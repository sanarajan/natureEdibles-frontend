import userApiClient from '../userApiClient';

export interface Notification {
    _id: string;
    userId: string;
    type: string;
    title: string;
    message: string;
    relatedId?: string;
    isRead: boolean;
    createdAt: string;
}

export const getUserNotifications = async () => {
    const response = await userApiClient.get('/user/notifications');
    return response.data;
};

export const markNotificationAsRead = async (id: string) => {
    const response = await userApiClient.put(`/user/notifications/${id}/read`);
    return response.data;
};
