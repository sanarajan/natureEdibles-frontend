import adminApiClient from '../adminApiClient';
import userApiClient from '../userApiClient';

export const getConsultationSettings = async () => {
    const response = await adminApiClient.get('/admin/consultation/settings');
    return response.data;
};

export const updateConsultationSettings = async (settings: any) => {
    const response = await adminApiClient.put('/admin/consultation/settings', settings);
    return response.data;
};

export const getUserConsultationSettings = async () => {
    const response = await userApiClient.get('/user/consultation/settings');
    return response.data;
};

export const getAvailableSlots = async (date: string) => {
    const response = await userApiClient.get('/user/consultation/available-slots', {
        params: { date }
    });
    return response.data;
};

export const createConsultationBooking = async (bookingData: any) => {
    const response = await userApiClient.post('/user/consultation', bookingData);
    return response.data;
};

export const getUserConsultations = async () => {
    const response = await userApiClient.get('/user/consultation/history');
    return response.data;
};

export const getAdminConsultations = async (params?: { page?: number; limit?: number; status?: string; search?: string }) => {
    const response = await adminApiClient.get('/admin/consultation/bookings', { params });
    return response.data;
};

export const getConsultationById = async (id: string) => {
    const response = await adminApiClient.get(`/admin/consultation/bookings/${id}`);
    return response.data;
};

export const updateConsultationStatus = async (id: string, updates: { status?: string; doctorNotes?: string; paymentStatus?: string; rejectionReason?: string }) => {
    const response = await adminApiClient.put(`/admin/consultation/bookings/${id}`, updates);
    return response.data;
};

export const updateConsultationPayment = async (id: string, upiReference: string) => {
    const response = await userApiClient.put(`/user/consultation/${id}/payment`, { upiReference });
    return response.data;
};
