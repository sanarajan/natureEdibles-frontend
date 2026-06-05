import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import userApiClient from '../../services/userApiClient';
import { toast } from 'react-toastify';
import { Copy, Download } from 'lucide-react';

const ManualPayment: React.FC = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // We expect order details (addressId, couponCode, referralCode, etc.) to be passed in location.state
    const checkoutState = location.state;

    const [settings, setSettings] = useState<any>(null);
    const [paymentReferenceId, setPaymentReferenceId] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!checkoutState) {
            toast.error("Invalid checkout session. Please try again.");
            navigate('/checkout');
            return;
        }
        fetchSettings();
    }, [checkoutState, navigate]);

    const fetchSettings = async () => {
        try {
            const response = await userApiClient.get('/user/payment-settings');
            if (response.data.success && response.data.settings) {
                setSettings(response.data.settings);
            } else {
                toast.error("Failed to load payment instructions.");
            }
        } catch (error: any) {
            console.error('Failed to fetch settings:', error);
            toast.error("Failed to load payment details. Please contact support.");
        }
    };

    const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard!`);
    };

    const handleDownloadQR = async () => {
        try {
            const qrUrl = checkoutState?.totalAmount 
                ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`upi://pay?pa=${settings.upiId === 'pending@upi' ? 'sanamol87@okaxis' : settings.upiId}&pn=Nature Edibles&am=${checkoutState.totalAmount}&cu=INR`)}` 
                : (settings.qrCodeImage.includes('placeholder') ? '/images/qrcode.jpeg' : settings.qrCodeImage);

            const response = await fetch(qrUrl);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = 'nature_edibles_upi_qr.jpeg';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Failed to download QR code:', error);
            toast.error('Failed to download QR code directly. Please try again.');
        }
    };



    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!paymentReferenceId.trim()) {
            toast.error("Please enter the Payment Reference ID (UTR).");
            return;
        }

        try {
            setLoading(true);
            const payload = {
                ...checkoutState,
                paymentMethod: 'Manual UPI',
                paymentReferenceId: paymentReferenceId.trim(),
                isOnline: false // To ensure Razorpay is not triggered
            };

            const response = await userApiClient.post('/user/order', payload);
            
            if (response.data.success) {
                toast.success("Order placed successfully! Awaiting verification.");
                navigate('/checkout/success', { state: { orderId: response.data.data.order.orderId } });
            }
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to place order.");
        } finally {
            setLoading(false);
        }
    };

    if (!settings) return <div className="text-center p-5"><div className="spinner-border text-primary" role="status"></div><p className="mt-2">Loading secure payment portal...</p></div>;

    return (
        <div className="page-content bg-light" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', padding: '40px 0' }}>
            <div className="container">
                <div className="row justify-content-center">
                    <div className="col-lg-8 col-md-10">
                        <div className="card shadow-lg border-0" style={{ borderRadius: '20px', overflow: 'hidden' }}>
                            {/* Header Section */}
                            <div className="bg-primary text-white text-center p-4" style={{ background: 'linear-gradient(135deg, #28a745, #20c997)' }}>
                                <h2 className="mb-1 fw-bold text-white">Secure UPI Payment</h2>
                                <p className="mb-0 text-white-50">Complete your order securely via any UPI app</p>
                            </div>

                            <div className="card-body p-5">
                                {/* Instructions */}
                                <div className="alert alert-info border-0 rounded-3 mb-5" style={{ backgroundColor: '#e8f5e9', color: '#1b5e20' }}>
                                    <h6 className="fw-bold mb-3"><i className="fas fa-info-circle me-2"></i>Payment Instructions</h6>
                                    <ol className="mb-0 ps-3">
                                        <li className="mb-2">Open Google Pay, PhonePe, Paytm, or any UPI app.</li>
                                        <li className="mb-2">Scan the QR code below or copy the UPI ID.</li>
                                        <li className="mb-2">Pay the exact amount shown in your checkout summary.</li>
                                        <li>Find the 12-digit UTR / Reference Number after successful payment and enter it below.</li>
                                    </ol>
                                </div>

                                <div className="row align-items-center mb-5">
                                    {/* QR Code Section */}
                                    <div className="col-md-5 text-center mb-4 mb-md-0 border-end border-light d-flex flex-column align-items-center">
                                        <div className="p-3 bg-white shadow-sm rounded-4 mb-3 d-inline-block" style={{ border: '2px dashed #ddd' }}>
                                            <img 
                                                src={checkoutState?.totalAmount ? `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`upi://pay?pa=${settings.upiId === 'pending@upi' ? 'sanamol87@okaxis' : settings.upiId}&pn=Nature Edibles&am=${checkoutState.totalAmount}&cu=INR`)}` : (settings.qrCodeImage.includes('placeholder') ? '/images/qrcode.jpeg' : settings.qrCodeImage)} 
                                                alt="UPI QR Code" 
                                                style={{ width: '200px', height: '200px', objectFit: 'contain' }} 
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <span className="badge bg-success bg-opacity-10 text-success px-3 py-2 fs-6 border border-success border-opacity-25 shadow-sm">
                                                Amount to Pay: <strong>₹{checkoutState?.totalAmount ? checkoutState.totalAmount.toFixed(2) : '---'}</strong>
                                            </span>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={handleDownloadQR}
                                            className="btn btn-outline-success btn-sm rounded-pill px-4"
                                        >
                                            <Download size={14} className="me-2" /> Download QR
                                        </button>
                                    </div>
                                    
                                    {/* Details Section */}
                                    <div className="col-md-7 ps-md-4">
                                        <div className="mb-4">
                                            <label className="text-muted small text-uppercase fw-bold mb-1">Business UPI ID</label>
                                            <div className="d-flex align-items-center p-3 bg-light rounded-3 border">
                                                <span className="fs-5 fw-bold text-dark flex-grow-1">
                                                    {settings.upiId === 'pending@upi' ? 'sanamol87@okaxis' : settings.upiId}
                                                </span>
                                                <button onClick={() => handleCopy(settings.upiId === 'pending@upi' ? 'sanamol87@okaxis' : settings.upiId, 'UPI ID')} className="btn btn-light btn-sm text-secondary rounded-circle shadow-sm" title="Copy UPI ID">
                                                    <Copy size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="text-muted small text-uppercase fw-bold mb-1">Support Phone Number</label>
                                            <div className="d-flex align-items-center p-3 bg-light rounded-3 border">
                                                <span className="fs-5 fw-bold text-dark flex-grow-1">
                                                    {settings.phoneNumber === '0000000000' ? 'Not provided' : settings.phoneNumber}
                                                </span>
                                                <button onClick={() => handleCopy(settings.phoneNumber === '0000000000' ? 'Not provided' : settings.phoneNumber, 'Phone Number')} className="btn btn-light btn-sm text-secondary rounded-circle shadow-sm" title="Copy Phone Number">
                                                    <Copy size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Form Section */}
                                <form onSubmit={handleSubmit} className="border-top pt-4">
                                    <div className="mb-4">
                                        <label className="form-label fw-bold text-dark">
                                            Enter 12-Digit UTR / Reference ID <span className="text-danger">*</span>
                                        </label>
                                        <div className="input-group input-group-lg">
                                            <span className="input-group-text bg-light border-end-0"><i className="fas fa-hashtag text-muted"></i></span>
                                            <input 
                                                type="text" 
                                                value={paymentReferenceId}
                                                onChange={(e) => setPaymentReferenceId(e.target.value)}
                                                placeholder="e.g. 312345678901"
                                                className="form-control border-start-0 ps-0 form-control-fl"
                                                style={{ boxShadow: 'none' }}
                                                required
                                            />
                                        </div>
                                        <small className="text-muted mt-2 d-block">You can find the UTR/Reference ID in the transaction details of your UPI app.</small>
                                    </div>
                                    
                                    <button 
                                        type="submit" 
                                        disabled={loading || !paymentReferenceId.trim()}
                                        className="btn btn-success btn-lg w-100 fw-bold shadow"
                                        style={{ borderRadius: '12px', padding: '14px', background: 'linear-gradient(135deg, #28a745, #20c997)', border: 'none' }}
                                    >
                                        {loading ? <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> : <i className="fas fa-check-circle me-2"></i>}
                                        {loading ? 'Processing Verification...' : 'Submit Reference ID & Complete Order'}
                                    </button>
                                </form>
                            </div>
                        </div>
                        <div className="text-center mt-4 text-muted">
                            <p className="small mb-0"><i className="fas fa-lock me-1"></i> Your payment details are encrypted and secure.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManualPayment;
