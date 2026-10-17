import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserConsultations } from '../../../services/api/consultationApi';
import { Loader2, Eye } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import './ConsultationBooking.css';
import Pagination from '../../../components/Pagination/Pagination';

const UserConsultationHistory: React.FC = () => {
    const { data: user } = useSelector((state: RootState) => state.auth.user);
    const [consultations, setConsultations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        document.body.classList.add('consultation-page-body');
        return () => {
            document.body.classList.remove('consultation-page-body');
        };
    }, []);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await getUserConsultations();
                if (res.success) {
                    setConsultations(res.data);
                }
            } catch (error: any) {
                toast.error(error.response?.data?.message || 'Failed to load consultation history');
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const [selectedConsultation, setSelectedConsultation] = useState<any>(null);

    const getConsultationStatusValue = (c: any) => {
        const val = c.consultationStatus || c.status;
        if (!val) return 'PENDING';
        return String(val).toUpperCase();
    };

    const getPaymentStatusValue = (c: any) => {
        let val = c.paymentStatus || c.payment_status;
        val = val ? String(val).toUpperCase() : '';
        if (!val || val === 'PENDING_VERIFICATION') {
            return c.upiReference ? 'PAID' : 'PENDING';
        } else if (val === 'VERIFIED') {
            return 'PAID';
        }
        return val;
    };

    const getStatusBadge = (c: any) => {
        const s = getConsultationStatusValue(c);
        const baseStyle = { padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' };
        switch (s) {
            case 'PENDING': return <span style={{ ...baseStyle, backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>Pending</span>;
            case 'APPROVED': return <span style={{ ...baseStyle, backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>Approved</span>;
            case 'REJECTED': return (
                <span 
                    style={{ ...baseStyle, backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca', cursor: 'help' }} 
                    title={c.rejectionReason ? `Reason: ${c.rejectionReason}` : 'Reason not available'}
                >
                    Rejected
                </span>
            );
            default: return <span style={{ ...baseStyle, backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' }}>{s}</span>;
        }
    };

    const getPaymentBadge = (c: any) => {
        const s = getPaymentStatusValue(c);
        const baseStyle = { padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' };
        switch (s) {
            case 'PAID': return <span style={{ ...baseStyle, backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0' }}>Paid</span>;
            case 'PENDING': return <span style={{ ...baseStyle, backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>Pending</span>;
            case 'REFUND_PENDING': return <span style={{ ...baseStyle, backgroundColor: '#ffedd5', color: '#c2410c', border: '1px solid #fed7aa' }}>Refund Pending</span>;
            case 'REFUNDED': return <span style={{ ...baseStyle, backgroundColor: '#e0f2fe', color: '#075985', border: '1px solid #bae6fd' }}>Refunded</span>;
            default: return <span style={{ ...baseStyle, backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' }}>{s}</span>;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = String(date.getFullYear()).slice(-2);
        return `${day}-${month}-${year}`;
    };

    return (
        <div className="consultation-wrapper page-content bg-light">
            <div className="dz-bnr-inr bg-secondary overlay-black-light" style={{ backgroundImage: "url('/images/background/bg1.jpg')" }}>
                <div className="container">
                    <div className="dz-bnr-inr-entry">
                        <h1>My Consultations</h1>
                        <nav aria-label="breadcrumb" className="breadcrumb-row">
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                                <li className="breadcrumb-item"><Link to="/account">Account</Link></li>
                                <li className="breadcrumb-item">Consultations</li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>

            <div className="content-inner-1">
                <div className="container">
                    <div className="row">
                        <aside className="col-xl-3">
                            <div className="toggle-info">
                                <h5 className="title mb-0">Account Navbar</h5>
                                <a className="toggle-btn" href="#accountSidebar">Account Menu</a>
                            </div>
                            <div className="sticky-top account-sidebar-wrapper">
                                <div className="account-sidebar" id="accountSidebar">
                                    <div className="profile-head">
                                        <div className="user-thumb">
                                            <img className="rounded-circle" src={user?.imageUrl || '/images/profile4.jpg'} alt="Profile" />
                                        </div>
                                        <h5 className="title mb-0">{user?.displayName || 'User'}</h5>
                                        <span className="text text-primary">{user?.email}</span>
                                    </div>
                                    <div className="account-nav">
                                        <div className="nav-title bg-light uppercase">DASHBOARD</div>
                                        <ul>
                                            <li><Link to="/account">Dashboard</Link></li>
                                            <li><Link to="/account/orders">Orders</Link></li>
                                            <li className="active"><Link to="/account/consultations">Consultation History</Link></li>
                                            <li><Link to="/account/downloads">Downloads</Link></li>
                                            <li><Link to="/account/return">Return request</Link></li>
                                        </ul>
                                        <div className="nav-title bg-light uppercase">ACCOUNT SETTINGS</div>
                                        <ul className="account-info-list">
                                            <li><Link to="/account/profile">Profile</Link></li>
                                            <li><Link to="/account/address">Address</Link></li>
                                            <li><Link to="/account/shipping">Shipping methods</Link></li>
                                            <li><Link to="/account/payment">Payment Methods</Link></li>
                                            <li><Link to="/account/review">Review</Link></li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </aside>

                        <section className="col-xl-9 account-wrapper">
                            <div className="account-card">
                                <div className="d-flex justify-content-between align-items-center mb-4">
                                    <h4 className="mb-0">My Consultations</h4>
                                    <Link to="/consultation-booking" className="btn btn-primary btn-sm">Book New</Link>
                                </div>
                                
                                {loading ? (
                                    <div className="d-flex justify-content-center py-5">
                                        <Loader2 className="animate-spin w-8 h-8 text-primary" />
                                    </div>
                                ) : consultations.length === 0 ? (
                                    <div className="text-center py-5 text-muted">
                                        <p>You have not booked any consultations yet.</p>
                                        <Link to="/consultation-booking" className="btn btn-outline-primary mt-2">Book a Consultation</Link>
                                    </div>
                                ) : (
                                    <>
                                        <div className="table-responsive table-style-1">
                                        <table className="table table-hover align-middle">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Date</th>
                                                    <th>Issue</th>
                                                    <th>Consultation Status</th>
                                                    <th>Payment Status</th>
                                                    <th className="text-end">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {consultations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map(c => (
                                                    <tr key={c.id || c._id}>
                                                        <td>{c.fullName || '-'}</td>
                                                        <td>{formatDate(c.appointmentDate)}<br/><small className="text-muted">{c.appointmentTime}</small></td>
                                                        <td className="text-truncate" style={{ maxWidth: '150px' }} title={c.mainHealthIssue}>{c.mainHealthIssue}</td>
                                                        <td>
                                                            {getStatusBadge(c)}
                                                        </td>
                                                        <td>{getPaymentBadge(c)}</td>
                                                        <td className="text-end">
                                                            <div className="d-flex justify-content-end gap-2">
                                                                <button 
                                                                    className="btn btn-sm btn-outline-primary px-2"
                                                                    onClick={() => setSelectedConsultation(c)}
                                                                    title="View Details"
                                                                >
                                                                    <Eye size={18} />
                                                                </button>
                                                                {c.status?.toUpperCase() === 'COMPLETED' && (
                                                                    <Link 
                                                                        to={`/account/consultations/${c.id || c._id}/diet-plan`}
                                                                        className="btn btn-sm btn-success px-3"
                                                                        title="View Diet Plan"
                                                                    >
                                                                        Diet Plan
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <Pagination
                                        currentPage={currentPage}
                                        totalPages={Math.ceil(consultations.length / itemsPerPage)}
                                        onPageChange={setCurrentPage}
                                    />
                                    </>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            {/* View Details Modal */}
            {selectedConsultation && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                        <div className="modal-content">
                            <div className="modal-header">
                                <h5 className="modal-title">Consultation Details</h5>
                                <button type="button" className="btn-close" onClick={() => setSelectedConsultation(null)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row mb-3 border-bottom pb-2">
                                    <div className="col-md-6 mb-2">
                                        <strong>Date & Time:</strong> {formatDate(selectedConsultation.appointmentDate)} {selectedConsultation.appointmentTime}
                                    </div>
                                    <div className="col-md-6 mb-2">
                                        <strong>Status:</strong> {getStatusBadge(selectedConsultation)}
                                    </div>
                                    <div className="col-md-6 mb-2">
                                        <strong>Payment Status:</strong> {getPaymentBadge(selectedConsultation)}
                                    </div>
                                    {selectedConsultation.paymentStatus === 'PAID' && selectedConsultation.upiReference && (
                                        <div className="col-md-6 mb-2">
                                            <strong>UTR / Ref No:</strong> {selectedConsultation.upiReference}
                                        </div>
                                    )}
                                </div>
                                <div className="row mb-3">
                                    <div className="col-md-4 mb-2">
                                        <strong>Patient Name:</strong> {selectedConsultation.fullName}
                                    </div>
                                    <div className="col-md-2 mb-2">
                                        <strong>Age:</strong> {selectedConsultation.age}
                                    </div>
                                    <div className="col-md-3 mb-2">
                                        <strong>Gender:</strong> {selectedConsultation.gender}
                                    </div>
                                    <div className="col-md-3 mb-2">
                                        <strong>Contact:</strong> {selectedConsultation.contactNumber || 'N/A'}
                                    </div>
                                </div>
                                <div className="row mb-3 border-bottom pb-2">
                                    <div className="col-md-4 mb-2">
                                        <strong>City:</strong> {selectedConsultation.city || 'N/A'}
                                    </div>
                                    <div className="col-md-4 mb-2">
                                        <strong>Country:</strong> {selectedConsultation.country || 'N/A'}
                                    </div>
                                    <div className="col-md-4 mb-2">
                                        <strong>Occupation:</strong> {selectedConsultation.occupation || 'N/A'}
                                    </div>
                                </div>
                                <div className="row mb-3 border-bottom pb-2">
                                    <div className="col-md-6 mb-2">
                                        <strong>Weight:</strong> {selectedConsultation.weight} kg
                                    </div>
                                    <div className="col-md-6 mb-2">
                                        <strong>Height:</strong> {selectedConsultation.height} cm
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <strong>Health Issue:</strong>
                                    <p className="bg-light p-2 rounded mt-1">{selectedConsultation.mainHealthIssue}</p>
                                </div>
                                <div className="row mb-3">
                                    <div className="col-md-6 mb-2">
                                        <strong>Years Facing Issue:</strong> {selectedConsultation.yearsFacingIssue}
                                    </div>
                                    <div className="col-md-6 mb-2">
                                        <strong>Current Medicines:</strong> {selectedConsultation.currentMedicines || 'N/A'}
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <strong>Medical Treatment History:</strong>
                                    <p className="bg-light p-2 rounded mt-1">{selectedConsultation.medicalTreatment || 'N/A'}</p>
                                </div>
                                {selectedConsultation.medicalTreatment === 'Yes' && selectedConsultation.treatmentDetails && (
                                    <div className="mb-3">
                                        <strong>Treatment Details:</strong>
                                        <p className="bg-light p-2 rounded mt-1">{selectedConsultation.treatmentDetails}</p>
                                    </div>
                                )}
                                <div className="mb-3">
                                    <strong>Symptoms:</strong>
                                    <p className="bg-light p-2 rounded mt-1">{selectedConsultation.symptoms || 'N/A'}</p>
                                </div>
                                <div className="mb-3">
                                    <strong>Food Allergies:</strong>
                                    <p className="bg-light p-2 rounded mt-1">{selectedConsultation.foodAllergies || 'None'}</p>
                                </div>
                                
                                <div className="row mb-3">
                                    <div className="col-md-6 mb-2">
                                        <strong>Trying To Conceive Since:</strong> {selectedConsultation.tryingToConceiveSince || 'N/A'}
                                    </div>
                                    <div className="col-md-6 mb-2">
                                        <strong>Miscarriage History:</strong> {selectedConsultation.miscarriageHistory || 'N/A'}
                                    </div>
                                    <div className="col-md-6 mb-2">
                                        <strong>IVF / IUI:</strong> {selectedConsultation.ivfIuiDetails || 'N/A'}
                                    </div>
                                    <div className="col-md-6 mb-2">
                                        <strong>Menstrual Cycle:</strong> {selectedConsultation.menstrualCycle || 'N/A'}
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <strong>Diagnosed Condition:</strong>
                                    <p className="bg-light p-2 rounded mt-1">{selectedConsultation.diagnosedCondition || 'N/A'}</p>
                                </div>

                                {selectedConsultation.medicalReports && selectedConsultation.medicalReports.length > 0 && (
                                    <div className="mb-3">
                                        <strong>Medical Reports:</strong>
                                        <div className="mt-2">
                                            {selectedConsultation.medicalReports.map((report: any, index: number) => {
                                                const fileUrl = report.url || report;
                                                const filename = fileUrl.split('/').pop()?.split('?')[0] || `Report_${index + 1}`;
                                                
                                                return (
                                                    <div key={index} className="d-flex align-items-center justify-content-between bg-light p-2 rounded mb-2">
                                                        <span className="text-truncate" style={{ maxWidth: '60%' }} title={filename}>{filename}</span>
                                                        <div>
                                                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary me-2">View</a>
                                                            <a href={fileUrl} download={filename} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-primary">Download</a>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {selectedConsultation.rejectionReason && (
                                    <div className="mb-3">
                                        <strong>Rejection Reason:</strong>
                                        <p className="text-danger bg-light p-2 rounded mt-1">{selectedConsultation.rejectionReason}</p>
                                    </div>
                                )}
                                {selectedConsultation.doctorNotes && (
                                    <div className="mb-3">
                                        <strong>Doctor Notes:</strong>
                                        <p className="bg-light p-2 rounded mt-1">{selectedConsultation.doctorNotes}</p>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setSelectedConsultation(null)}>Close</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserConsultationHistory;
