import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import adminApiClient from '../../../services/adminApiClient';
import { toast } from 'react-toastify';
import { Loader2, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import './PaymentSettings.css';

interface PaymentAccount {
    _id: string;
    accountName: string;
    qrCodeImage: string;
    upiId: string;
    phoneNumber: string;
    status: 'Active' | 'Inactive';
    isDefault: boolean;
    usedCount: number;
    createdAt?: string;
    updatedAt?: string;
}

const PaymentAccountView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [account, setAccount] = useState<PaymentAccount | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAccount();
    }, [id]);

    const fetchAccount = async () => {
        try {
            setLoading(true);
            const response = await adminApiClient.get('/admin/payment-settings');
            if (response.data.success && response.data.settings) {
                const foundAccount = response.data.settings.find((acc: PaymentAccount) => acc._id === id);
                if (foundAccount) {
                    setAccount(foundAccount);
                } else {
                    toast.error('Payment account not found.');
                    navigate('/admin/payment-settings');
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to load Payment Account');
            navigate('/admin/payment-settings');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center py-5">
                <Loader2 className="animate-spin w-8 h-8 text-primary" />
            </div>
        );
    }

    if (!account) {
        return null;
    }

    return (
        <div className="admin-page-container p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="h4 mb-0">Payment Account Details</h2>
                <Link to="/admin/payment-settings" className="btn btn-outline-secondary d-flex align-items-center">
                    <ArrowLeft className="w-4 h-4 me-2" /> Back to Payment Settings
                </Link>
            </div>

            <div className="card shadow-sm border-0 mb-4" style={{ maxWidth: '800px' }}>
                <div className="card-header bg-white pt-4 pb-2 border-0">
                    <h5 className="mb-0">Account Information</h5>
                </div>
                <div className="card-body">
                    <div className="row mb-3">
                        <div className="col-md-4 fw-medium text-muted">Account Name</div>
                        <div className="col-md-8 fw-bold">{account.accountName}</div>
                    </div>
                    <hr className="text-muted opacity-25 my-3" />
                    
                    <div className="row mb-3">
                        <div className="col-md-4 fw-medium text-muted">Phone Number</div>
                        <div className="col-md-8">{account.phoneNumber}</div>
                    </div>
                    <hr className="text-muted opacity-25 my-3" />

                    <div className="row mb-3">
                        <div className="col-md-4 fw-medium text-muted">UPI ID</div>
                        <div className="col-md-8">{account.upiId}</div>
                    </div>
                    <hr className="text-muted opacity-25 my-3" />

                    <div className="row mb-3">
                        <div className="col-md-4 fw-medium text-muted">Status</div>
                        <div className="col-md-8">
                            <span className={`payment-status-badge ${account.status === 'Active' ? 'payment-status-active' : 'payment-status-inactive'}`}>
                                {account.status === 'Active' ? '🟢 Active' : '⚪ Inactive'}
                            </span>
                        </div>
                    </div>
                    <hr className="text-muted opacity-25 my-3" />

                    <div className="row mb-3">
                        <div className="col-md-4 fw-medium text-muted">Default Account</div>
                        <div className="col-md-8">
                            {account.isDefault ? (
                                <span className="d-flex align-items-center text-success fw-medium">
                                    <CheckCircle2 className="w-5 h-5 me-1" /> Yes
                                </span>
                            ) : (
                                <span className="d-flex align-items-center text-secondary fw-medium">
                                    <XCircle className="w-5 h-5 me-1" /> No
                                </span>
                            )}
                        </div>
                    </div>
                    <hr className="text-muted opacity-25 my-3" />

                    <div className="row mb-3">
                        <div className="col-md-4 fw-medium text-muted">Used Count</div>
                        <div className="col-md-8">
                            <span className={`payment-used-count ${account.usedCount > 0 ? 'payment-count-locked' : 'payment-count-unlocked'}`}>
                                {account.usedCount || 0}
                            </span>
                        </div>
                    </div>
                    <hr className="text-muted opacity-25 my-3" />

                    <div className="row mb-3">
                        <div className="col-md-4 fw-medium text-muted">Created Date</div>
                        <div className="col-md-8">{formatDate(account.createdAt)}</div>
                    </div>
                    <hr className="text-muted opacity-25 my-3" />

                    {account.updatedAt && (
                        <div className="row mb-3">
                            <div className="col-md-4 fw-medium text-muted">Updated Date</div>
                            <div className="col-md-8">{formatDate(account.updatedAt)}</div>
                        </div>
                    )}
                    {account.updatedAt && <hr className="text-muted opacity-25 my-3" />}

                    <div className="row mb-3">
                        <div className="col-md-4 fw-medium text-muted">QR Code</div>
                        <div className="col-md-8">
                            {account.qrCodeImage ? (
                                <div className="border rounded p-3 text-center bg-light" style={{ maxWidth: '300px' }}>
                                    <img 
                                        src={account.qrCodeImage} 
                                        alt="QR Code" 
                                        className="mx-auto max-w-full h-auto border shadow-sm p-2 bg-white" 
                                        style={{ maxHeight: '250px' }} 
                                    />
                                </div>
                            ) : (
                                <div className="text-muted fst-italic">No QR code available</div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
            
            <div className="mt-4">
                <Link to="/admin/payment-settings" className="btn btn-outline-secondary">
                    Back to Payment Settings
                </Link>
            </div>
        </div>
    );
};

export default PaymentAccountView;
