import React, { useEffect, useState } from 'react';
import { getAdminConsultations, updateConsultationStatus } from '../../../services/api/consultationApi';
import { toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';

const AdminConsultations: React.FC = () => {
    const [consultations, setConsultations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchConsultations = async () => {
        try {
            setLoading(true);
            const res = await getAdminConsultations();
            if (res.success) {
                setConsultations(res.data);
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

    const handleStatusUpdate = async (id: string, newStatus: string) => {
        try {
            const res = await updateConsultationStatus(id, newStatus, '');
            if (res.success) {
                toast.success('Status updated successfully');
                fetchConsultations();
            } else {
                toast.error(res.message || 'Failed to update status');
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update status');
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Pending': return <span className="badge bg-warning text-dark">Pending</span>;
            case 'Confirmed': return <span className="badge bg-success">Confirmed</span>;
            case 'Completed': return <span className="badge bg-info">Completed</span>;
            case 'Cancelled': return <span className="badge bg-danger">Cancelled</span>;
            default: return <span className="badge bg-secondary">{status}</span>;
        }
    };

    return (
        <div className="admin-page-container p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="h4 mb-0">Consultation Bookings</h2>
            </div>

            <div className="card shadow-sm border-0">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="d-flex justify-content-center py-5">
                            <Loader2 className="animate-spin w-8 h-8 text-primary" />
                        </div>
                    ) : consultations.length === 0 ? (
                        <div className="text-center py-5 text-muted">
                            <p>No consultations found.</p>
                        </div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>User</th>
                                        <th>Date</th>
                                        <th>Time</th>
                                        <th>Health Issue</th>
                                        <th>Status</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {consultations.map(c => (
                                        <tr key={c._id}>
                                            <td>
                                                <div className="fw-bold">{c.userId?.displayName || c.userId?.username || 'Unknown User'}</div>
                                                <div className="small text-muted">{c.userId?.email}</div>
                                            </td>
                                            <td>{new Date(c.appointmentDate).toLocaleDateString()}</td>
                                            <td>{c.appointmentTime}</td>
                                            <td style={{ maxWidth: '200px' }} className="text-truncate" title={c.mainHealthIssue}>
                                                {c.mainHealthIssue}
                                            </td>
                                            <td>{getStatusBadge(c.status)}</td>
                                            <td>
                                                <select
                                                    className="form-select form-select-sm w-auto"
                                                    value={c.status}
                                                    onChange={(e) => handleStatusUpdate(c._id, e.target.value)}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Confirmed">Confirmed</option>
                                                    <option value="Completed">Completed</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </select>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminConsultations;
