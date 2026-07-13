import React, { useState, useEffect } from 'react';
import adminApiClient from '../../../services/adminApiClient';
import { toast } from 'react-toastify';
import { Loader2, UploadCloud, RefreshCw, Plus, Edit, Trash2, CheckCircle2, XCircle } from 'lucide-react';
import Swal from 'sweetalert2';
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
}

const PaymentSettings: React.FC = () => {
    const [accounts, setAccounts] = useState<PaymentAccount[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    // View state
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [accountName, setAccountName] = useState('');
    const [qrCodeImage, setQrCodeImage] = useState('');
    const [upiId, setUpiId] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
    const [isDefault, setIsDefault] = useState(false);
    
    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const response = await adminApiClient.get('/admin/payment-settings');
            if (response.data.success && response.data.settings) {
                setAccounts(response.data.settings);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to load Payment Accounts');
        } finally {
            setLoading(false);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
            if (!allowedTypes.includes(file.type)) {
                setErrors(prev => ({ ...prev, qrCodeImage: 'Invalid file type. Only PNG, JPG, JPEG, and WEBP are allowed.' }));
                return;
            }
            if (file.size > 2 * 1024 * 1024) {
                setErrors(prev => ({ ...prev, qrCodeImage: 'File size must be less than 2 MB.' }));
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setQrCodeImage(reader.result as string);
                if (errors.qrCodeImage) {
                    setErrors(prev => {
                        const next = { ...prev };
                        delete next.qrCodeImage;
                        return next;
                    });
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const validate = () => {
        const newErrors: any = {};
        let isValid = true;

        if (!accountName.trim()) {
            newErrors.accountName = 'Account Name is required.';
            isValid = false;
        }

        if (!qrCodeImage) {
            newErrors.qrCodeImage = 'QR Code Image is required.';
            isValid = false;
        }

        const upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
        if (!upiId) {
            newErrors.upiId = 'UPI ID is required.';
            isValid = false;
        } else if (!upiRegex.test(upiId)) {
            newErrors.upiId = 'Invalid UPI ID format. Example: name@okaxis';
            isValid = false;
        }

        const phoneRegex = /^\+?[0-9]{10,15}$/;
        if (!phoneNumber) {
            newErrors.phoneNumber = 'Phone Number is required.';
            isValid = false;
        } else if (!phoneRegex.test(phoneNumber)) {
            newErrors.phoneNumber = 'Invalid phone number format. Digits only (optional leading +).';
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) {
            toast.error("Please correct the highlighted fields.");
            return;
        }

        try {
            setSaving(true);
            const payload = { accountName, qrCodeImage, upiId, phoneNumber, status, isDefault };
            
            let response;
            if (editingId) {
                response = await adminApiClient.put(`/admin/payment-settings/${editingId}`, payload);
            } else {
                response = await adminApiClient.post('/admin/payment-settings', payload);
            }

            if (response.data.success) {
                toast.success(editingId ? 'Payment Account updated successfully' : 'Payment Account created successfully');
                setShowForm(false);
                resetForm();
                fetchAccounts();
            } else {
                toast.error(response.data.message || 'Failed to save Payment Account');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save Payment Account');
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'Delete Payment Account?',
            text: 'Are you sure you want to delete this payment account? This action cannot be undone.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Delete',
            cancelButtonText: 'Cancel'
        });

        if (!result.isConfirmed) return;

        try {
            const response = await adminApiClient.delete(`/admin/payment-settings/${id}`);
            if (response.data.success) {
                toast.success('Payment Account deleted successfully');
                fetchAccounts();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete account');
        }
    };

    const handleSetDefault = async (id: string) => {
        try {
            const response = await adminApiClient.put(`/admin/payment-settings/${id}/default`);
            if (response.data.success) {
                toast.success('Default account updated');
                fetchAccounts();
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update default account');
        }
    };

    const openAddForm = () => {
        resetForm();
        setShowForm(true);
    };

    const openEditForm = (account: PaymentAccount) => {
        setEditingId(account._id);
        setAccountName(account.accountName);
        setQrCodeImage(account.qrCodeImage);
        setUpiId(account.upiId);
        setPhoneNumber(account.phoneNumber);
        setStatus(account.status);
        setIsDefault(account.isDefault);
        setErrors({});
        setShowForm(true);
    };

    const resetForm = () => {
        setEditingId(null);
        setAccountName('');
        setQrCodeImage('');
        setUpiId('');
        setPhoneNumber('');
        setStatus('Active');
        setIsDefault(false);
        setErrors({});
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center py-5">
                <Loader2 className="animate-spin w-8 h-8 text-primary" />
            </div>
        );
    }

    return (
        <div className="admin-page-container p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="h4 mb-0">Payment Accounts</h2>
                {!showForm && (
                    <button onClick={openAddForm} className="btn btn-primary d-flex align-items-center">
                        <Plus className="w-4 h-4 me-2" /> Add Payment Account
                    </button>
                )}
            </div>

            {showForm ? (
                <div className="card shadow-sm border-0 mb-4" style={{ maxWidth: '800px' }}>
                    <div className="card-header bg-white pt-4 pb-2 border-0 d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">{editingId ? 'Edit Payment Account' : 'New Payment Account'}</h5>
                        <button onClick={() => { setShowForm(false); resetForm(); }} className="btn btn-sm btn-outline-secondary">Cancel</button>
                    </div>
                    <div className="card-body">
                        <form onSubmit={handleSave}>
                            <div className="row g-4 mb-4">
                                <div className="col-md-12">
                                    <label className="form-label fw-medium">Account Name</label>
                                    <input 
                                        type="text" 
                                        value={accountName} 
                                        onChange={(e) => { 
                                            setAccountName(e.target.value); 
                                            if(errors.accountName) {
                                                setErrors(prev => {
                                                    const next = { ...prev };
                                                    delete next.accountName;
                                                    return next;
                                                });
                                            }
                                        }} 
                                        className={`form-control ${errors.accountName ? 'is-invalid' : ''}`} 
                                        placeholder="e.g. Primary Bank Account" 
                                    />
                                    {errors.accountName && <div className="invalid-feedback">{errors.accountName}</div>}
                                </div>
                            </div>
                            
                            <div className="mb-4">
                                <label className="form-label fw-medium">QR Code Image</label>
                                {!qrCodeImage ? (
                                    <div className={`border rounded p-5 text-center ${errors.qrCodeImage ? 'border-danger' : ''}`} style={{ borderStyle: errors.qrCodeImage ? 'solid' : 'dashed' }}>
                                        <input 
                                            type="file" 
                                            accept="image/png, image/jpeg, image/jpg, image/webp" 
                                            onChange={handleImageChange} 
                                            className="d-none" 
                                            id="qrUpload"
                                        />
                                        <label htmlFor="qrUpload" className="d-block mb-0" style={{ cursor: 'pointer' }}>
                                            <UploadCloud className="mx-auto text-muted mb-3" style={{ width: '48px', height: '48px' }} />
                                            <span className="text-primary fw-medium">Click to upload</span> or drag and drop
                                            <div className="text-muted small mt-2">PNG, JPG, WEBP up to 2MB</div>
                                        </label>
                                    </div>
                                ) : (
                                    <div className={`border rounded p-4 text-center ${errors.qrCodeImage ? 'border-danger' : ''}`}>
                                        <img src={qrCodeImage} alt="QR Code Preview" className="mx-auto max-w-full h-auto mb-3 border shadow-sm p-2 bg-white" style={{ maxHeight: '250px' }} />
                                        <div>
                                            <input 
                                                type="file" 
                                                accept="image/png, image/jpeg, image/jpg, image/webp" 
                                                onChange={handleImageChange} 
                                                className="d-none" 
                                                id="qrReplace"
                                            />
                                            <label htmlFor="qrReplace" className="btn btn-sm btn-outline-secondary mb-0" style={{ cursor: 'pointer' }}>
                                                <RefreshCw className="w-4 h-4 me-1 d-inline align-text-bottom" /> Replace Image
                                            </label>
                                        </div>
                                    </div>
                                )}
                                {errors.qrCodeImage && <div className="text-danger small mt-2">{errors.qrCodeImage}</div>}
                            </div>

                            <div className="row g-4 mb-4">
                                <div className="col-md-6">
                                    <label className="form-label fw-medium">UPI ID</label>
                                    <input 
                                        type="text" 
                                        value={upiId} 
                                        onChange={(e) => { 
                                            setUpiId(e.target.value); 
                                            if(errors.upiId) {
                                                setErrors(prev => {
                                                    const next = { ...prev };
                                                    delete next.upiId;
                                                    return next;
                                                });
                                            }
                                        }} 
                                        className={`form-control ${errors.upiId ? 'is-invalid' : ''}`} 
                                        placeholder="e.g. name@okaxis" 
                                    />
                                    {errors.upiId && <div className="invalid-feedback">{errors.upiId}</div>}
                                </div>
                                
                                <div className="col-md-6">
                                    <label className="form-label fw-medium">Phone Number</label>
                                    <input 
                                        type="text" 
                                        value={phoneNumber} 
                                        onChange={(e) => { 
                                            setPhoneNumber(e.target.value); 
                                            if(errors.phoneNumber) {
                                                setErrors(prev => {
                                                    const next = { ...prev };
                                                    delete next.phoneNumber;
                                                    return next;
                                                });
                                            }
                                        }} 
                                        className={`form-control ${errors.phoneNumber ? 'is-invalid' : ''}`} 
                                        placeholder="e.g. 9876543210" 
                                    />
                                    {errors.phoneNumber && <div className="invalid-feedback">{errors.phoneNumber}</div>}
                                </div>
                            </div>
                            
                            <div className="row g-4 mb-4">
                                <div className="col-md-6">
                                    <label className="form-label fw-medium">Status</label>
                                    <select 
                                        className="form-select" 
                                        value={status} 
                                        onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
                                    >
                                        <option value="Active">Active</option>
                                        <option value="Inactive">Inactive</option>
                                    </select>
                                </div>
                                
                                <div className="col-md-6 d-flex align-items-center pt-4">
                                    <div className="form-check form-switch mt-2">
                                        <input 
                                            className={`form-check-input ${isDefault ? 'bg-success border-success' : 'bg-secondary border-secondary'}`} 
                                            type="checkbox" 
                                            role="switch"
                                            id="isDefaultSwitchForm"
                                            checked={isDefault}
                                            onChange={(e) => setIsDefault(e.target.checked)}
                                            style={{ cursor: 'pointer', transform: 'scale(1.2)' }}
                                        />
                                        <label className="form-check-label fw-medium ms-3 text-dark" htmlFor="isDefaultSwitchForm" style={{ cursor: 'pointer' }}>
                                            Set as Default
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="d-flex justify-content-end mt-4">
                                <button type="submit" className="btn btn-primary px-5 py-2" disabled={saving}>
                                    {saving ? <Loader2 className="animate-spin w-4 h-4 d-inline me-2 align-text-bottom" /> : null}
                                    Save Account
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="card shadow-sm border-0">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle mb-0 payment-settings-table">
                            <thead className="table-light">
                                <tr>
                                    <th>Account Name</th>
                                    <th>Phone</th>
                                    <th>UPI ID</th>
                                    <th>Status</th>
                                    <th>Default</th>
                                    <th>Used Count</th>
                                    <th className="text-end">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {accounts.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-4 text-muted">No payment accounts configured.</td>
                                    </tr>
                                ) : (
                                    accounts.map((acc) => {
                                        const isLocked = acc.usedCount > 0;
                                        
                                        const actionButtons = (
                                            <>
                                                <button 
                                                    className={`btn btn-sm ${isLocked ? 'btn-outline-secondary' : 'btn-outline-primary'} me-2`}
                                                    onClick={() => !isLocked && openEditForm(acc)}
                                                    disabled={isLocked}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    className={`btn btn-sm ${isLocked ? 'btn-outline-secondary' : 'btn-outline-danger'}`}
                                                    onClick={() => !isLocked && handleDelete(acc._id)}
                                                    disabled={isLocked}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </>
                                        );

                                        return (
                                            <tr key={acc._id}>
                                                <td className="fw-medium">{acc.accountName}</td>
                                                <td>{acc.phoneNumber}</td>
                                                <td>{acc.upiId}</td>
                                                <td>
                                                    <span className={`payment-status-badge ${acc.status === 'Active' ? 'payment-status-active' : 'payment-status-inactive'}`}>
                                                        {acc.status === 'Active' ? '🟢 Active' : '⚪ Inactive'}
                                                    </span>
                                                </td>
                                                <td>
                                                    {acc.isDefault ? (
                                                        <CheckCircle2 className="text-success w-5 h-5" />
                                                    ) : (
                                                        <XCircle className="text-secondary w-5 h-5" />
                                                    )}
                                                </td>
                                                <td>
                                                    <span className={`payment-used-count ${isLocked ? 'payment-count-locked' : 'payment-count-unlocked'}`}>
                                                        {acc.usedCount || 0}
                                                    </span>
                                                </td>
                                                <td className="text-end text-nowrap">
                                                    {acc.isDefault ? (
                                                        <button className="btn btn-success text-white btn-sm me-3 payment-default-btn fw-bold" disabled>
                                                            ✔ Default
                                                        </button>
                                                    ) : (
                                                        <button 
                                                            className="btn btn-outline-secondary btn-sm me-3 payment-default-btn"
                                                            onClick={() => handleSetDefault(acc._id)}
                                                        >
                                                            Set as Default
                                                        </button>
                                                    )}
                                                    {isLocked ? (
                                                        <div 
                                                            className="d-inline-block cursor-not-allowed" 
                                                            title="This payment account has already been used and cannot be modified."
                                                        >
                                                            {actionButtons}
                                                        </div>
                                                    ) : (
                                                        actionButtons
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentSettings;
