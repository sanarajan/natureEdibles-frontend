import React, { useState, useEffect } from 'react';
import adminApiClient from '../../../services/adminApiClient';
import { toast } from 'react-toastify';

const PaymentSettings: React.FC = () => {
    const [qrCodeImage, setQrCodeImage] = useState('');
    const [upiId, setUpiId] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await adminApiClient.get('/payment-settings');
            if (response.data.success && response.data.settings) {
                setQrCodeImage(response.data.settings.qrCodeImage);
                setUpiId(response.data.settings.upiId);
                setPhoneNumber(response.data.settings.phoneNumber);
            }
        } catch (error: any) {
            console.error('Failed to fetch settings:', error);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setQrCodeImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
        if (!qrCodeImage || !upiId || !phoneNumber) {
            toast.error("All fields are required");
            return;
        }

        try {
            setLoading(true);
            const response = await adminApiClient.put('/payment-settings', {
                qrCodeImage, upiId, phoneNumber
            });
            if (response.data.success) {
                toast.success('Payment Settings updated successfully');
            }
        } catch (error: any) {
            toast.error('Failed to update Payment Settings');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6">
            <h2 className="text-2xl font-semibold mb-6">Payment Settings (Manual UPI)</h2>
            <div className="bg-white p-6 rounded shadow-md max-w-2xl">
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">QR Code Image</label>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                    {qrCodeImage && <img src={qrCodeImage} alt="QR Code" className="mt-4 w-48 h-48 object-contain border" />}
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID</label>
                    <input type="text" value={upiId} onChange={(e) => setUpiId(e.target.value)} className="w-full border rounded p-2" placeholder="e.g. merchant@upi" />
                </div>

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                    <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full border rounded p-2" placeholder="e.g. 9876543210" />
                </div>

                <button 
                    onClick={handleSave} 
                    disabled={loading}
                    className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? 'Saving...' : 'Save Settings'}
                </button>
            </div>
        </div>
    );
};

export default PaymentSettings;
