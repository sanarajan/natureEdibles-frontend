import React, { useEffect, useState } from 'react';
import { getAdminConsultations, updateConsultationStatus } from '../../../services/api/consultationApi';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import { Loader2, Search, Filter, Download, Eye, FileText, Utensils } from 'lucide-react';
import '../../../styles/admin-pages.css';
import adminApiClient from '../../../services/adminApiClient';
import AdminDietPlanForm from './AdminDietPlanForm';
import AdminDietPlanView from './AdminDietPlanView';
import Pagination from '../../../components/Pagination/Pagination';

const AdminConsultations: React.FC = () => {
    const [consultations, setConsultations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;
    
    // Modal states
    const [selectedConsultation, setSelectedConsultation] = useState<any>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    
    // Rejection state
    const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [updatingStatus, setUpdatingStatus] = useState(false);

    // Diet Plan state
    const [isDietPlanFormOpen, setIsDietPlanFormOpen] = useState(false);
    const [isDietPlanViewOpen, setIsDietPlanViewOpen] = useState(false);
    const [selectedConsultationForDietPlan, setSelectedConsultationForDietPlan] = useState<any>(null);
    const [dietPlanStatusMap, setDietPlanStatusMap] = useState<Record<string, boolean>>({});

    // Edit Date State
    const [isEditingDate, setIsEditingDate] = useState(false);
    const [editDateValue, setEditDateValue] = useState('');

    // Mark as Completed Modal State
    const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
    const [consultationToComplete, setConsultationToComplete] = useState<any>(null);
    const [completePaymentAmount, setCompletePaymentAmount] = useState('');
    const [completePaymentAmountError, setCompletePaymentAmountError] = useState('');
    const [isCompleting, setIsCompleting] = useState(false);

    // Add Consultation Payment Modal State (for Completed + Pending)
    const [isAddPaymentModalOpen, setIsAddPaymentModalOpen] = useState(false);
    const [consultationToAddPayment, setConsultationToAddPayment] = useState<any>(null);
    const [addPaymentAmount, setAddPaymentAmount] = useState('');
    const [addPaymentAmountError, setAddPaymentAmountError] = useState('');
    const [isSavingPayment, setIsSavingPayment] = useState(false);

    const getStoredPaymentAmounts = (): Record<string, number> => {
        try {
            const stored = localStorage.getItem('consultation_payment_amounts');
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    };

    const storePaymentAmount = (id: string, amount: number) => {
        try {
            const current = getStoredPaymentAmounts();
            current[id] = amount;
            localStorage.setItem('consultation_payment_amounts', JSON.stringify(current));
        } catch {
            // ignore
        }
    };

    const checkDietPlansForConsultations = async (list: any[]) => {
        if (!Array.isArray(list) || list.length === 0) return;
        const completedList = list.filter(c => c.status?.toUpperCase() === 'COMPLETED');
        if (completedList.length === 0) return;

        try {
            const checks = await Promise.allSettled(
                completedList.map(async (c) => {
                    const cId = c._id || c.id;
                    try {
                        const res = await adminApiClient.get(`/admin/diet-plan/consultation/${cId}`);
                        return { id: cId, hasPlan: !!(res.data?.success && res.data?.data) };
                    } catch {
                        return { id: cId, hasPlan: false };
                    }
                })
            );
            const map: Record<string, boolean> = {};
            checks.forEach(result => {
                if (result.status === 'fulfilled' && result.value) {
                    map[result.value.id] = result.value.hasPlan;
                }
            });
            setDietPlanStatusMap(prev => ({ ...prev, ...map }));
        } catch {
            // Silently ignore check errors
        }
    };

    const fetchConsultations = async () => {
        try {
            setLoading(true);
            const res = await getAdminConsultations();
            if (res.success) {
                const result = res.data;
                const list = Array.isArray(result) 
                    ? result 
                    : Array.isArray(result?.bookings) 
                    ? result.bookings 
                    : Array.isArray(result?.data) 
                    ? result.data 
                    : [];
                setConsultations(list);
                checkDietPlansForConsultations(list);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to load consultations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConsultations();
    }, []);

    useEffect(() => {
        if (selectedConsultation) {
            const cId = selectedConsultation._id || selectedConsultation.id;
            if (cId && dietPlanStatusMap[cId] === undefined && selectedConsultation.status?.toUpperCase() === 'COMPLETED') {
                adminApiClient.get(`/admin/diet-plan/consultation/${cId}`)
                    .then(res => {
                        const hasPlan = !!(res.data?.success && res.data?.data);
                        setDietPlanStatusMap(prev => ({ ...prev, [cId]: hasPlan }));
                    })
                    .catch(() => {
                        setDietPlanStatusMap(prev => ({ ...prev, [cId]: false }));
                    });
            }
        }
    }, [selectedConsultation]);

    const handleStatusUpdate = async (id: string, updates: { status?: string; paymentStatus?: string; rejectionReason?: string; paymentAmount?: number }): Promise<boolean> => {
        try {
            setUpdatingStatus(true);
            const res = await updateConsultationStatus(id, updates as any);
            if (res.success && res.data) {
                let successMessage = 'Status updated successfully';
                if (updates.status === 'APPROVED') {
                    successMessage = 'Consultation approved successfully.';
                } else if (updates.status === 'REJECTED') {
                    successMessage = 'Consultation rejected successfully.';
                } else if (updates.status === 'COMPLETED') {
                    successMessage = 'Consultation marked as completed successfully.';
                } else if (updates.paymentStatus === 'REFUNDED') {
                    successMessage = 'Refund marked as completed successfully.';
                }
                toast.success(successMessage);
                
                const updated = res.data;
                
                setConsultations(prev => {
                    const list = Array.isArray(prev) ? prev : [];
                    return list.map(item => {
                        const itemId = item.id || item._id;
                        const updatedId = updated.id || updated._id;
                        return itemId === updatedId ? { ...item, ...updated, _id: itemId, id: itemId } : item;
                    });
                });
                
                // Update local selected state if view modal is open
                setSelectedConsultation((prev: any) => {
                    if (prev) {
                        const prevId = prev.id || prev._id;
                        const updatedId = updated.id || updated._id;
                        if (prevId === updatedId) {
                            return {
                                ...prev,
                                ...updated,
                                _id: prevId,
                                id: prevId
                            };
                        }
                    }
                    return prev;
                });
                return true;
            } else {
                toast.error(res.message || 'Failed to update status');
                return false;
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update status');
            return false;
        } finally {
            setUpdatingStatus(false);
        }
    };

    const openCompleteModal = (c: any) => {
        setConsultationToComplete(c);
        setCompletePaymentAmount('');
        setCompletePaymentAmountError('');
        setIsCompleteModalOpen(true);
    };

    const closeCompleteModal = () => {
        if (isCompleting) return;
        setIsCompleteModalOpen(false);
        setConsultationToComplete(null);
        setCompletePaymentAmount('');
        setCompletePaymentAmountError('');
    };

    const handleCompletePaymentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Accept empty string or positive numeric with optional single decimal point up to 2 decimal places
        if (val === '' || /^\d+(\.\d{0,2})?$/.test(val) || /^\d+\.$/.test(val)) {
            setCompletePaymentAmount(val);
            if (completePaymentAmountError) {
                setCompletePaymentAmountError('');
            }
        }
    };

    const handleCompleteSubmit = async () => {
        if (!consultationToComplete) return;

        const trimmed = completePaymentAmount.trim();
        let numericAmount: number | undefined = undefined;

        if (trimmed !== '') {
            const num = Number(trimmed);
            if (isNaN(num)) {
                setCompletePaymentAmountError('Please enter a valid numeric payment amount.');
                return;
            }
            if (num <= 0) {
                setCompletePaymentAmountError('Payment amount must be greater than ₹0.');
                return;
            }
            numericAmount = num;
        }

        const cId = consultationToComplete._id || consultationToComplete.id;
        if (!cId) {
            toast.error('Invalid consultation ID.');
            return;
        }

        try {
            setIsCompleting(true);
            setCompletePaymentAmountError('');

            const updates: any = { status: 'COMPLETED' };
            if (numericAmount !== undefined) {
                updates.paymentStatus = 'PAID';
                updates.paymentAmount = numericAmount;
            }

            const res = await updateConsultationStatus(cId, updates);

            if (res.success && res.data) {
                if (numericAmount !== undefined) {
                    storePaymentAmount(cId, numericAmount);
                }
                toast.success('Consultation marked as completed successfully.');
                const updated = res.data;

                // Update consultations list
                setConsultations(prev => {
                    const list = Array.isArray(prev) ? prev : [];
                    return list.map(item => {
                        const itemId = item.id || item._id;
                        return itemId === cId
                            ? {
                                  ...item,
                                  ...updated,
                                  status: 'COMPLETED',
                                  ...(numericAmount !== undefined
                                      ? { paymentStatus: 'PAID', paymentAmount: numericAmount }
                                      : {}),
                                  _id: itemId,
                                  id: itemId
                              }
                            : item;
                    });
                });

                // Update selected consultation if view details is open
                setSelectedConsultation((prev: any) => {
                    if (prev) {
                        const prevId = prev.id || prev._id;
                        if (prevId === cId) {
                            return {
                                ...prev,
                                ...updated,
                                status: 'COMPLETED',
                                ...(numericAmount !== undefined
                                    ? { paymentStatus: 'PAID', paymentAmount: numericAmount }
                                    : {}),
                                _id: prevId,
                                id: prevId
                            };
                        }
                    }
                    return prev;
                });

                setIsCompleteModalOpen(false);
                setConsultationToComplete(null);
                setCompletePaymentAmount('');
            } else {
                toast.error(res.message || 'Failed to complete consultation');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to complete consultation');
        } finally {
            setIsCompleting(false);
        }
    };

    const validatePaymentAmountValue = (val: string): { isValid: boolean; error: string; num: number | null } => {
        const trimmed = val.trim();
        if (!trimmed) {
            return { isValid: false, error: 'Payment amount is required.', num: null };
        }
        if (!/^\d+(\.\d{1,2})?$/.test(trimmed)) {
            return { isValid: false, error: 'Please enter a valid numeric payment amount.', num: null };
        }
        const num = Number(trimmed);
        if (isNaN(num)) {
            return { isValid: false, error: 'Please enter a valid numeric payment amount.', num: null };
        }
        if (num <= 0) {
            return { isValid: false, error: 'Payment amount must be greater than ₹0.', num: null };
        }
        return { isValid: true, error: '', num };
    };

    const isAddPaymentAmountValid = validatePaymentAmountValue(addPaymentAmount).isValid;

    const openAddPaymentModal = (c: any) => {
        setConsultationToAddPayment(c);
        setAddPaymentAmount('');
        setAddPaymentAmountError('');
        setIsAddPaymentModalOpen(true);
    };

    const closeAddPaymentModal = () => {
        if (isSavingPayment) return;
        setIsAddPaymentModalOpen(false);
        setConsultationToAddPayment(null);
        setAddPaymentAmount('');
        setAddPaymentAmountError('');
    };

    const handleAddPaymentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        // Accept empty string or positive numeric with optional single decimal point up to 2 decimal places
        if (val === '' || /^\d+(\.\d{0,2})?$/.test(val) || /^\d+\.$/.test(val)) {
            setAddPaymentAmount(val);
            if (val.trim() === '') {
                setAddPaymentAmountError('');
            } else {
                const validation = validatePaymentAmountValue(val);
                setAddPaymentAmountError(validation.isValid ? '' : validation.error);
            }
        }
    };

    const handleAddPaymentSubmit = async () => {
        if (!consultationToAddPayment) return;

        const validation = validatePaymentAmountValue(addPaymentAmount);
        if (!validation.isValid || validation.num === null) {
            setAddPaymentAmountError(validation.error);
            return;
        }

        const num = validation.num;
        const cId = consultationToAddPayment._id || consultationToAddPayment.id;
        if (!cId) {
            toast.error('Invalid consultation ID.');
            return;
        }

        try {
            setIsSavingPayment(true);
            setAddPaymentAmountError('');

            const res = await updateConsultationStatus(cId, {
                paymentStatus: 'PAID',
                paymentAmount: num
            } as any);

            if (res.success && res.data) {
                storePaymentAmount(cId, num);
                toast.success('Payment recorded successfully as Paid.');
                const updated = res.data;

                // Update consultations list
                setConsultations(prev => {
                    const list = Array.isArray(prev) ? prev : [];
                    return list.map(item => {
                        const itemId = item.id || item._id;
                        return itemId === cId
                            ? {
                                  ...item,
                                  ...updated,
                                  paymentStatus: 'PAID',
                                  paymentAmount: num,
                                  _id: itemId,
                                  id: itemId
                              }
                            : item;
                    });
                });

                // Update selected consultation if view details is open
                setSelectedConsultation((prev: any) => {
                    if (prev) {
                        const prevId = prev.id || prev._id;
                        if (prevId === cId) {
                            return {
                                ...prev,
                                ...updated,
                                paymentStatus: 'PAID',
                                paymentAmount: num,
                                _id: prevId,
                                id: prevId
                            };
                        }
                    }
                    return prev;
                });

                setIsAddPaymentModalOpen(false);
                setConsultationToAddPayment(null);
                setAddPaymentAmount('');
            } else {
                toast.error(res.message || 'Failed to save payment');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to save payment');
        } finally {
            setIsSavingPayment(false);
        }
    };

    const handleApprove = async (c: any) => {
        const result = await Swal.fire({
            title: 'Approve Consultation',
            text: "Are you sure you want to approve this consultation booking?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#22c55e',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Approve',
            background: '#ffffff',
            customClass: {
                popup: 'admin-swal-popup',
                confirmButton: 'admin-swal-confirm',
                cancelButton: 'admin-swal-cancel'
            }
        });

        if (result.isConfirmed) {
            handleStatusUpdate(c._id, { status: 'APPROVED' });
        }
    };

    const openRejectModal = () => {
        setRejectionReason('');
        setIsRejectModalOpen(true);
    };

    const handleRejectSubmit = () => {
        if (!selectedConsultation) return;
        if (rejectionReason.trim().length < 3) {
            toast.error('Rejection reason must be at least 3 characters long');
            return;
        }
        
        const isPaid = selectedConsultation.paymentStatus === 'PAID' || (selectedConsultation.upiReference && selectedConsultation.paymentStatus !== 'REFUNDED');
        const updates: any = { 
            status: 'REJECTED', 
            rejectionReason 
        };
        
        if (isPaid) {
            updates.paymentStatus = 'REFUND_PENDING';
        }
        
        handleStatusUpdate(selectedConsultation._id, updates);
        setIsRejectModalOpen(false);
    };

    const handleMarkRefunded = async (c: any) => {
        const result = await Swal.fire({
            title: 'Confirm Refund',
            text: "Confirm that the refund has been completed for this consultation booking?",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#0284c7',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Mark as Refunded',
            background: '#ffffff',
            customClass: {
                popup: 'admin-swal-popup',
                confirmButton: 'admin-swal-confirm',
                cancelButton: 'admin-swal-cancel'
            }
        });

        if (result.isConfirmed) {
            handleStatusUpdate(c._id, { paymentStatus: 'REFUNDED' });
        }
    };

    const handleSetRefundPending = async (c: any) => {
        const result = await Swal.fire({
            title: 'Set Refund Pending',
            text: 'Mark this rejected consultation payment as Refund Pending?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#0284c7',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Set Refund Pending',
            background: '#ffffff',
            customClass: {
                popup: 'admin-swal-popup',
                confirmButton: 'admin-swal-confirm',
                cancelButton: 'admin-swal-cancel'
            }
        });

        if (result.isConfirmed) {
            handleStatusUpdate(c._id, { paymentStatus: 'REFUND_PENDING' });
        }
    };

    const getStatusBadge = (status: string) => {
        const s = status?.toUpperCase() || 'PENDING';
        switch (s) {
            case 'PENDING': return <span className="admin-badge badge-warning text-dark" style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>Pending</span>;
            case 'APPROVED': return <span className="admin-badge badge-success">Approved</span>;
            case 'COMPLETED': return <span className="admin-badge" style={{ backgroundColor: '#d8b4fe', color: '#581c87', border: '1px solid #c084fc' }}>Completed</span>;
            case 'REJECTED': return <span className="admin-badge badge-danger">Rejected</span>;
            default: return <span className="admin-badge">{status}</span>;
        }
    };

    const getPaymentBadge = (c: any) => {
        // Fallback safety logic
        let s = c.paymentStatus?.toUpperCase();
        if (!s || s === 'PENDING_VERIFICATION') {
            s = c.upiReference ? 'PAID' : 'PENDING';
        } else if (s === 'VERIFIED') {
            s = 'PAID';
        }
        
        const isCompleted = c.status?.toUpperCase() === 'COMPLETED';
        const isPaymentClickable = isCompleted && s === 'PENDING';
        const isRefundPending = s === 'REFUND_PENDING' && c.status?.toUpperCase() === 'REJECTED';

        switch (s) {
            case 'PENDING': return (
                <span 
                    className="admin-badge badge-warning text-dark" 
                    style={{ 
                        backgroundColor: '#fef3c7', 
                        color: '#92400e', 
                        border: '1px solid #fde68a',
                        cursor: isPaymentClickable ? 'pointer' : 'default',
                        boxShadow: isPaymentClickable ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                        transition: 'all 0.15s ease'
                    }}
                    onClick={(e) => {
                        if (isPaymentClickable) {
                            e.stopPropagation();
                            openAddPaymentModal(c);
                        }
                    }}
                    title={isPaymentClickable ? "Click to add payment" : ""}
                >
                    Pending
                </span>
            );
            case 'PAID': return <span className="admin-badge badge-success">Paid</span>;
            case 'REFUND_PENDING': return (
                <span 
                    className="admin-badge badge-warning" 
                    style={{ 
                        backgroundColor: '#ffedd5', 
                        color: '#c2410c', 
                        border: '1px solid #fed7aa',
                        cursor: isRefundPending ? 'pointer' : 'default',
                    }}
                    onClick={(e) => {
                        if (isRefundPending) {
                            e.stopPropagation();
                            handleMarkRefunded(c);
                        }
                    }}
                    title={isRefundPending ? "Click to mark as refunded" : ""}
                >
                    Refund Pending
                </span>
            );
            case 'REFUNDED': return <span className="admin-badge badge-info" style={{ backgroundColor: '#e0f2fe', color: '#0369a1', border: '1px solid #bae6fd' }}>Refunded</span>;
            default: return <span className="admin-badge badge-secondary">{s}</span>;
        }
    };
    
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '-';
        return d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' }).replace(/\//g, '-');
    };

    const consultationList = Array.isArray(consultations) ? consultations : [];
    
    // Basic search filtering
    const filteredConsultations = consultationList.filter(c => 
        (c.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.contactNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.upiReference || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    const totalPages = Math.ceil(filteredConsultations.length / itemsPerPage);
    const displayedConsultations = filteredConsultations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <h1 className="page-title">Consultation Bookings</h1>
            </div>

            <div className="admin-card">
                <div className="card-filter-header">
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search by customer name, phone, or UTR..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                        />
                    </div>
                </div>

                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Customer Name</th>
                                <th>Date</th>
                                <th>Time</th>
                                <th>Health Issue</th>
                                <th>UTR</th>
                                <th>Payment</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                                        <Loader2 className="animate-spin w-8 h-8 text-primary mx-auto" />
                                    </td>
                                </tr>
                            ) : displayedConsultations.length === 0 ? (
                                <tr>
                                    <td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>No consultations found</td>
                                </tr>
                            ) : (
                                displayedConsultations.map(c => {
                                    const bookingId = c._id || c.id;
                                    return (
                                    <tr key={bookingId}>
                                        <td style={{ fontWeight: 600 }}>{c.fullName || '-'}</td>
                                        <td>{formatDate(c.appointmentDate)}</td>
                                        <td>{c.appointmentTime || '-'}</td>
                                        <td style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={c.mainHealthIssue}>
                                            {c.mainHealthIssue || '-'}
                                        </td>
                                        <td>
                                            {c.upiReference ? (
                                                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>{c.upiReference}</span>
                                            ) : (
                                                <span className="text-muted small">N/A</span>
                                            )}
                                        </td>
                                        <td>{getPaymentBadge(c)}</td>
                                        <td>{getStatusBadge(c.status)}</td>
                                        <td>
                                            <div className="table-actions">
                                                <button 
                                                    className="action-btn" 
                                                    title="View Details"
                                                    onClick={() => {
                                                        setSelectedConsultation({ ...c, _id: bookingId });
                                                        setIsViewModalOpen(true);
                                                    }}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                {dietPlanStatusMap[bookingId] && (
                                                    <button 
                                                        className="action-btn" 
                                                        title="View Diet Plan"
                                                        style={{ color: '#16a34a' }}
                                                        onClick={() => {
                                                            setSelectedConsultationForDietPlan({ ...c, _id: bookingId });
                                                            setIsDietPlanViewOpen(true);
                                                        }}
                                                    >
                                                        <Utensils size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )})
                            )}
                        </tbody>
                    </table>
                </div>

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* View Details Modal */}
            {isViewModalOpen && selectedConsultation && (
                <div className="cancellation-reason-overlay" style={{ zIndex: 1050 }}>
                    <div className="cancellation-reason-box admin-card p-0" style={{ maxWidth: '700px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="p-4 border-bottom d-flex justify-content-between align-items-center bg-light" style={{ borderTopLeftRadius: '24px', borderTopRightRadius: '24px' }}>
                            <h5 className="fw-bold mb-0">Consultation Details</h5>
                            <button className="btn-close" onClick={() => setIsViewModalOpen(false)}></button>
                        </div>
                        
                        <div className="p-4 overflow-auto">
                            <div className="row g-4">
                                <div className="col-md-6">
                                    <h6 className="fw-bold text-muted text-uppercase small mb-3">Customer Details</h6>
                                    <p className="mb-1"><strong>Name:</strong> {selectedConsultation.fullName || '-'}</p>
                                    <p className="mb-1"><strong>Age / Gender:</strong> {selectedConsultation.age} / {selectedConsultation.gender}</p>
                                    <p className="mb-1"><strong>Contact:</strong> {selectedConsultation.contactNumber || '-'}</p>
                                    <p className="mb-1"><strong>City/Country:</strong> {selectedConsultation.city}, {selectedConsultation.country}</p>
                                    <p className="mb-1"><strong>Weight/Height:</strong> {selectedConsultation.currentWeight} / {selectedConsultation.height}</p>
                                </div>
                                <div className="col-md-6">
                                    <h6 className="fw-bold text-muted text-uppercase small mb-3">Consultation Details</h6>
                                    <div className="mb-1 d-flex align-items-center gap-2">
                                        <strong>Date:</strong> 
                                        {isEditingDate ? (
                                            <div className="d-flex align-items-center gap-2">
                                                <input 
                                                    type="date" 
                                                    className="form-control form-control-sm" 
                                                    value={editDateValue}
                                                    onChange={(e) => setEditDateValue(e.target.value)}
                                                    min={new Date().toISOString().split('T')[0]}
                                                />
                                                <button 
                                                    className="btn btn-sm btn-success"
                                                    onClick={async () => {
                                                        try {
                                                            setUpdatingStatus(true);
                                                            const { updateConsultationDate } = await import('../../../services/api/consultationApi');
                                                            const res = await updateConsultationDate(selectedConsultation._id, editDateValue);
                                                            if (res.success) {
                                                                toast.success('Consultation date updated successfully');
                                                                setSelectedConsultation({ ...selectedConsultation, appointmentDate: editDateValue });
                                                                setIsEditingDate(false);
                                                                fetchConsultations();
                                                            }
                                                        } catch (error: any) {
                                                            toast.error(error.response?.data?.message || 'Error updating date');
                                                        } finally {
                                                            setUpdatingStatus(false);
                                                        }
                                                    }}
                                                    disabled={updatingStatus}
                                                >
                                                    Save
                                                </button>
                                                <button 
                                                    className="btn btn-sm btn-light"
                                                    onClick={() => setIsEditingDate(false)}
                                                    disabled={updatingStatus}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                {formatDate(selectedConsultation.appointmentDate)}
                                                {(!selectedConsultation.status || selectedConsultation.status.toUpperCase() === 'PENDING' || selectedConsultation.status.toUpperCase() === 'APPROVED') && (
                                                    <button 
                                                        className="btn btn-sm btn-link text-primary p-0 ms-2"
                                                        onClick={() => {
                                                            setEditDateValue(new Date(selectedConsultation.appointmentDate).toISOString().split('T')[0]);
                                                            setIsEditingDate(true);
                                                        }}
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    <p className="mb-1"><strong>Time:</strong> {selectedConsultation.appointmentTime}</p>
                                    <p className="mb-1"><strong>Health Issue:</strong> {selectedConsultation.mainHealthIssue}</p>
                                    <p className="mb-1"><strong>Years Facing Issue:</strong> {selectedConsultation.yearsFacingIssue}</p>
                                </div>
                                <div className="col-12">
                                    <h6 className="fw-bold text-muted text-uppercase small mb-3">Medical Details</h6>
                                    <p className="mb-1"><strong>Current Medicines:</strong> {selectedConsultation.currentMedicines || 'None'}</p>
                                    <p className="mb-1"><strong>Medical Treatment:</strong> {selectedConsultation.medicalTreatment || 'None'}</p>
                                    {selectedConsultation.treatmentDetails && (
                                        <p className="mb-1"><strong>Treatment Details:</strong> {selectedConsultation.treatmentDetails}</p>
                                    )}
                                    <p className="mb-1"><strong>Symptoms:</strong> {selectedConsultation.symptoms?.length > 0 ? selectedConsultation.symptoms.join(', ') : 'None'}</p>
                                    <p className="mb-1"><strong>Food Allergies:</strong> {selectedConsultation.foodAllergies || 'None'}</p>
                                </div>
                                <div className="col-12">
                                    <h6 className="fw-bold text-muted text-uppercase small mb-3 mt-2">Medical Reports</h6>
                                    {(!selectedConsultation.medicalReports || selectedConsultation.medicalReports.length === 0) ? (
                                        <p className="mb-1 text-muted small">No medical reports uploaded.</p>
                                    ) : (
                                        <div className="d-flex flex-column gap-2">
                                            {selectedConsultation.medicalReports.map((report: any, index: number) => {
                                                const reportUrl = typeof report === 'string' ? report : (report.url || report.secure_url);
                                                if (!reportUrl) return null;
                                                
                                                let reportName = `Medical_Report_${index + 1}`;
                                                if (typeof report === 'string') {
                                                    try {
                                                        const urlObj = new URL(report);
                                                        const filename = urlObj.pathname.split('/').pop();
                                                        if (filename) reportName = filename;
                                                    } catch(e) {}
                                                } else {
                                                    reportName = report.name || report.original_filename || reportName;
                                                }
                                                
                                                return (
                                                    <div key={index} className="d-flex align-items-center justify-content-between p-2 border rounded bg-white">
                                                        <div className="d-flex align-items-center gap-2 overflow-hidden">
                                                            <FileText size={16} className="text-primary flex-shrink-0" />
                                                            <span className="small text-truncate" title={reportName} style={{ maxWidth: '200px' }}>
                                                                {reportName}
                                                            </span>
                                                        </div>
                                                        <div className="d-flex gap-2 flex-shrink-0">
                                                            <button 
                                                                onClick={async () => {
                                                                    if (!reportUrl) {
                                                                        toast.error("Medical report URL is unavailable.");
                                                                        return;
                                                                    }
                                                                    
                                                                    const previewWindow = window.open('', '_blank');
                                                                    
                                                                    try {
                                                                        const response = await fetch(reportUrl);
                                                                        if (!response.ok) {
                                                                            throw new Error('Failed to load report');
                                                                        }
                                                                        
                                                                        const blob = await response.blob();
                                                                        
                                                                        // Ensure correct MIME type for preview if backend sent octet-stream
                                                                        let finalBlob = blob;
                                                                        const lowerUrl = reportUrl.toLowerCase();
                                                                        if (lowerUrl.endsWith('.pdf')) {
                                                                            finalBlob = new Blob([blob], { type: 'application/pdf' });
                                                                        } else if (lowerUrl.endsWith('.jpg') || lowerUrl.endsWith('.jpeg')) {
                                                                            finalBlob = new Blob([blob], { type: 'image/jpeg' });
                                                                        } else if (lowerUrl.endsWith('.png')) {
                                                                            finalBlob = new Blob([blob], { type: 'image/png' });
                                                                        }

                                                                        const blobUrl = URL.createObjectURL(finalBlob);
                                                                        
                                                                        if (previewWindow) {
                                                                            previewWindow.location.href = blobUrl;
                                                                        }
                                                                    } catch (error) {
                                                                        if (previewWindow) {
                                                                            previewWindow.close();
                                                                        }
                                                                        toast.error("Preview is not available for this file type. Please download the file.");
                                                                    }
                                                                }}
                                                                className="btn btn-sm btn-light d-flex align-items-center gap-1"
                                                                title="View"
                                                            >
                                                                <Eye size={14} /> View
                                                            </button>
                                                            <button 
                                                                onClick={async () => {
                                                                    try {
                                                                        const response = await fetch(reportUrl);
                                                                        const blob = await response.blob();
                                                                        const objectUrl = URL.createObjectURL(blob);
                                                                        const link = document.createElement('a');
                                                                        link.href = objectUrl;
                                                                        link.download = reportName;
                                                                        document.body.appendChild(link);
                                                                        link.click();
                                                                        document.body.removeChild(link);
                                                                        URL.revokeObjectURL(objectUrl);
                                                                    } catch (error) {
                                                                        window.open(reportUrl, '_blank', 'noopener,noreferrer');
                                                                    }
                                                                }}
                                                                className="btn btn-sm btn-light d-flex align-items-center gap-1"
                                                                title="Download"
                                                            >
                                                                <Download size={14} /> Download
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                <div className="col-md-6">
                                    <h6 className="fw-bold text-muted text-uppercase small mb-3">Status</h6>
                                    <div className="mb-2">{getStatusBadge(selectedConsultation.status)}</div>
                                    {selectedConsultation.status?.toUpperCase() === 'REJECTED' && selectedConsultation.rejectionReason && (
                                        <div className="alert alert-danger py-2 px-3 mt-2 small" style={{ borderRadius: '8px' }}>
                                            <strong>Rejection Reason:</strong><br/>{selectedConsultation.rejectionReason}
                                        </div>
                                    )}
                                </div>
                                <div className="col-md-6">
                                    <h6 className="fw-bold text-muted text-uppercase small mb-3">Payment Details</h6>
                                    <div className="mb-2 d-flex align-items-center gap-2">
                                        {getPaymentBadge(selectedConsultation)}
                                        {selectedConsultation.status?.toUpperCase() === 'COMPLETED' && selectedConsultation.paymentStatus?.toUpperCase() !== 'PAID' && selectedConsultation.paymentStatus?.toUpperCase() !== 'REFUNDED' && (
                                            <button 
                                                type="button"
                                                className="btn btn-sm btn-outline-success" 
                                                style={{ borderRadius: '8px', fontSize: '0.75rem', padding: '2px 8px', fontWeight: 600 }}
                                                onClick={() => openAddPaymentModal(selectedConsultation)}
                                            >
                                                Add Payment
                                            </button>
                                        )}
                                    </div>
                                    {(selectedConsultation.paymentAmount || getStoredPaymentAmounts()[selectedConsultation._id || selectedConsultation.id]) && (
                                        <p className="mb-1 mt-2"><strong>Payment Amount:</strong> ₹{selectedConsultation.paymentAmount || getStoredPaymentAmounts()[selectedConsultation._id || selectedConsultation.id]}</p>
                                    )}
                                    <p className="mb-1 mt-2"><strong>UTR:</strong> {selectedConsultation.upiReference ? <span style={{fontFamily: 'monospace', fontWeight: 600}}>{selectedConsultation.upiReference}</span> : 'N/A'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-top bg-light d-flex justify-content-end gap-2" style={{ borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
                            <button className="btn btn-light" style={{ borderRadius: '12px' }} onClick={() => setIsViewModalOpen(false)}>Close</button>
                            
                            {(!selectedConsultation.status || selectedConsultation.status.toUpperCase() === 'PENDING') && (
                                <>
                                    <button 
                                        className="btn btn-danger" 
                                        style={{ borderRadius: '12px' }}
                                        onClick={openRejectModal}
                                    >
                                        Reject
                                    </button>
                                    <button 
                                        className="btn btn-success" 
                                        style={{ borderRadius: '12px' }}
                                        onClick={() => handleApprove(selectedConsultation)}
                                        disabled={updatingStatus}
                                    >
                                        {updatingStatus ? 'Saving...' : 'Approve'}
                                    </button>
                                </>
                            )}
                            
                            {selectedConsultation.status?.toUpperCase() === 'APPROVED' && (
                                <button 
                                    className="btn btn-primary" 
                                    style={{ borderRadius: '12px' }}
                                    onClick={() => openCompleteModal(selectedConsultation)}
                                    disabled={updatingStatus || isCompleting}
                                >
                                    Mark as Completed
                                </button>
                            )}

                            {selectedConsultation.status?.toUpperCase() === 'COMPLETED' && (
                                <button 
                                    className="btn btn-secondary" 
                                    style={{ borderRadius: '12px', backgroundColor: '#8b5cf6', borderColor: '#8b5cf6', color: 'white' }}
                                    onClick={() => {
                                        setIsViewModalOpen(false);
                                        setIsDietPlanFormOpen(true);
                                    }}
                                >
                                    Add / Edit Diet Plan
                                </button>
                            )}

                            {selectedConsultation.status?.toUpperCase() === 'COMPLETED' && dietPlanStatusMap[selectedConsultation._id || selectedConsultation.id] && (
                                <button 
                                    className="btn btn-success" 
                                    style={{ borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                    onClick={() => {
                                        setSelectedConsultationForDietPlan(selectedConsultation);
                                        setIsViewModalOpen(false);
                                        setIsDietPlanViewOpen(true);
                                    }}
                                >
                                    <Utensils size={16} /> View Diet Plan
                                </button>
                            )}
                            

                        </div>
                    </div>
                </div>
            )}

            {/* Rejection Modal (stacked on top of view modal) */}
            {isRejectModalOpen && (
                <div className="cancellation-reason-overlay" style={{ zIndex: 1100 }}>
                    <div className="cancellation-reason-box admin-card p-4" style={{ maxWidth: '400px' }}>
                        <h5 className="fw-bold mb-3">Reject Consultation</h5>
                        <p className="small text-muted mb-4">
                            Please provide a reason for rejecting this consultation. This reason will be shown to the customer.
                        </p>
                        <div className="mb-4">
                            <label className="form-label fw-bold small">Rejection Reason</label>
                            <textarea
                                className="admin-input w-100"
                                rows={3}
                                placeholder="Enter reason here..."
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                            />
                        </div>
                        <div className="d-flex gap-2 justify-content-end">
                            <button className="btn btn-light" style={{ borderRadius: '12px' }} onClick={() => setIsRejectModalOpen(false)}>Cancel</button>
                            <button
                                className="btn btn-danger"
                                style={{ borderRadius: '12px' }}
                                onClick={handleRejectSubmit}
                                disabled={updatingStatus}
                            >
                                {updatingStatus ? 'Processing...' : 'Confirm Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mark as Completed Confirmation Modal */}
            {isCompleteModalOpen && consultationToComplete && (
                <div className="cancellation-reason-overlay" style={{ zIndex: 1100 }}>
                    <div className="cancellation-reason-box admin-card p-4" style={{ maxWidth: '440px', background: '#ffffff' }}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="fw-bold mb-0">Mark Consultation as Completed</h5>
                            <button 
                                type="button" 
                                className="btn-close" 
                                onClick={closeCompleteModal}
                                disabled={isCompleting}
                                aria-label="Close"
                            ></button>
                        </div>
                        
                        <p className="text-muted small mb-3">
                            Are you sure you want to mark this consultation as completed?
                        </p>

                        <div className="mb-3">
                            <label className="form-label fw-bold small mb-1">
                                Payment Amount
                            </label>
                            <div style={{ position: 'relative' }}>
                                <span 
                                    style={{ 
                                        position: 'absolute', 
                                        left: '14px', 
                                        top: '50%', 
                                        transform: 'translateY(-50%)', 
                                        color: '#64748b', 
                                        fontWeight: 600,
                                        fontSize: '1rem',
                                        pointerEvents: 'none'
                                    }}
                                >
                                    ₹
                                </span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    className="admin-input w-100"
                                    style={{
                                        paddingLeft: '32px',
                                        borderColor: completePaymentAmountError ? '#ef4444' : '#e2e8f0',
                                        borderRadius: '12px',
                                        fontWeight: 500,
                                        fontSize: '0.95rem'
                                    }}
                                    placeholder="Enter payment amount (optional)"
                                    value={completePaymentAmount}
                                    onChange={handleCompletePaymentAmountChange}
                                    disabled={isCompleting}
                                    autoFocus
                                />
                            </div>
                            {completePaymentAmountError ? (
                                <div className="text-danger small mt-1" style={{ fontSize: '0.8rem' }}>
                                    {completePaymentAmountError}
                                </div>
                            ) : (
                                <div className="text-muted small mt-1" style={{ fontSize: '0.8rem' }}>
                                    Optional — leave blank if payment has not been received yet.
                                </div>
                            )}
                        </div>

                        <div className="d-flex gap-2 justify-content-end mt-4">
                            <button 
                                type="button"
                                className="btn btn-light" 
                                style={{ borderRadius: '12px' }} 
                                onClick={closeCompleteModal}
                                disabled={isCompleting}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                style={{ borderRadius: '12px', minWidth: '140px' }}
                                onClick={handleCompleteSubmit}
                                disabled={isCompleting}
                            >
                                {isCompleting ? (
                                    <span className="d-flex align-items-center gap-2 justify-content-center">
                                        <Loader2 className="animate-spin" size={16} /> Processing...
                                    </span>
                                ) : (
                                    'Mark Completed'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Consultation Payment Modal */}
            {isAddPaymentModalOpen && consultationToAddPayment && (
                <div className="cancellation-reason-overlay" style={{ zIndex: 1100 }}>
                    <div className="cancellation-reason-box admin-card p-4" style={{ maxWidth: '440px', background: '#ffffff' }}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h5 className="fw-bold mb-0">Add Consultation Payment</h5>
                            <button 
                                type="button" 
                                className="btn-close" 
                                onClick={closeAddPaymentModal}
                                disabled={isSavingPayment}
                                aria-label="Close"
                            ></button>
                        </div>

                        <div className="p-3 mb-3 bg-light" style={{ fontSize: '0.875rem', borderRadius: '12px' }}>
                            <p className="mb-1"><strong>Patient:</strong> {consultationToAddPayment.fullName || '-'}</p>
                            <p className="mb-1"><strong>Date:</strong> {formatDate(consultationToAddPayment.appointmentDate)} {consultationToAddPayment.appointmentTime ? `(${consultationToAddPayment.appointmentTime})` : ''}</p>
                            <p className="mb-0"><strong>Status:</strong> <span className="admin-badge" style={{ backgroundColor: '#d8b4fe', color: '#581c87', border: '1px solid #c084fc', fontSize: '0.75rem', padding: '2px 8px' }}>Completed</span></p>
                        </div>

                        <div className="mb-4">
                            <label className="form-label fw-bold small mb-1">
                                Payment Amount <span className="text-danger">*</span>
                            </label>
                            <div style={{ position: 'relative' }}>
                                <span 
                                    style={{ 
                                        position: 'absolute', 
                                        left: '14px', 
                                        top: '50%', 
                                        transform: 'translateY(-50%)', 
                                        color: '#64748b', 
                                        fontWeight: 600,
                                        fontSize: '1rem',
                                        pointerEvents: 'none'
                                    }}
                                >
                                    ₹
                                </span>
                                <input
                                    type="text"
                                    inputMode="decimal"
                                    className="admin-input w-100"
                                    style={{
                                        paddingLeft: '32px',
                                        borderColor: addPaymentAmountError ? '#ef4444' : '#e2e8f0',
                                        borderRadius: '12px',
                                        fontWeight: 500,
                                        fontSize: '0.95rem'
                                    }}
                                    placeholder="Enter payment amount"
                                    value={addPaymentAmount}
                                    onChange={handleAddPaymentAmountChange}
                                    disabled={isSavingPayment}
                                    autoFocus
                                />
                            </div>
                            {addPaymentAmountError && (
                                <div className="text-danger small mt-1" style={{ fontSize: '0.8rem' }}>
                                    {addPaymentAmountError}
                                </div>
                            )}
                        </div>

                        <div className="d-flex gap-2 justify-content-end">
                            <button 
                                type="button"
                                className="btn btn-light" 
                                style={{ borderRadius: '12px' }} 
                                onClick={closeAddPaymentModal}
                                disabled={isSavingPayment}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="btn btn-success"
                                style={{ borderRadius: '12px', minWidth: '130px' }}
                                onClick={handleAddPaymentSubmit}
                                disabled={!isAddPaymentAmountValid || isSavingPayment}
                            >
                                {isSavingPayment ? (
                                    <span className="d-flex align-items-center gap-2 justify-content-center">
                                        <Loader2 className="animate-spin" size={16} /> Saving...
                                    </span>
                                ) : (
                                    'Save Payment'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .cancellation-reason-overlay {
                    position: fixed; top: 0; left: 0; right: 0; bottom: 0;
                    background: rgba(15, 23, 42, 0.4); backdrop-filter: blur(4px);
                    display: flex; align-items: center; justify-content: center;
                }
                .cancellation-reason-box {
                    width: 100%; border-radius: 24px !important; box-shadow: 0 30px 60px rgba(0,0,0,0.15) !important;
                }
                .admin-input {
                    border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px; font-size: 0.95rem; outline: none;
                }
                .admin-input:focus { border-color: var(--admin-primary); box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1); }
                .admin-swal-deny {
                    border-radius: 12px !important;
                    font-weight: 600 !important;
                    padding: 10px 20px !important;
                }
            `}</style>
            {isDietPlanFormOpen && selectedConsultation && (
                <AdminDietPlanForm 
                    consultation={selectedConsultation} 
                    onClose={() => {
                        setIsDietPlanFormOpen(false);
                        const cId = selectedConsultation._id || selectedConsultation.id;
                        if (cId) {
                            adminApiClient.get(`/admin/diet-plan/consultation/${cId}`)
                                .then(res => {
                                    const hasPlan = !!(res.data?.success && res.data?.data);
                                    setDietPlanStatusMap(prev => ({ ...prev, [cId]: hasPlan }));
                                })
                                .catch(() => {});
                        }
                    }} 
                />
            )}
            {isDietPlanViewOpen && selectedConsultationForDietPlan && (
                <AdminDietPlanView 
                    consultation={selectedConsultationForDietPlan} 
                    consultationId={selectedConsultationForDietPlan._id || selectedConsultationForDietPlan.id}
                    onClose={() => {
                        setIsDietPlanViewOpen(false);
                        setSelectedConsultationForDietPlan(null);
                    }} 
                />
            )}
        </div>
    );
};

export default AdminConsultations;
