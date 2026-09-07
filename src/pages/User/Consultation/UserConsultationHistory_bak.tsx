import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getUserConsultations } from '../../../services/api/consultationApi';
import { Loader2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../store';
import './ConsultationBooking.css';

const UserConsultationHistory: React.FC = () => {
    const { data: user } = useSelector((state: RootState) => state.auth.user);
    const [consultations, setConsultations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'Pending': return <span className="badge badge-warning text-dark">Pending</span>;
            case 'Confirmed': return <span className="badge badge-success">Confirmed</span>;
            case 'Completed': return <span className="badge badge-info">Completed</span>;
            case 'Cancelled': return <span className="badge badge-danger">Cancelled</span>;
            default: return <span className="badge badge-secondary">{status}</span>;
        }
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
                                    <div className="table-responsive table-style-1">
                                        <table className="table table-hover">
                                            <thead>
                                                <tr>
                                                    <th>Date</th>
                                                    <th>Time</th>
                                                    <th>Issue</th>
                                                    <th>Status</th>
                                                    <th>Notes</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {consultations.map(c => (
                                                    <tr key={c._id}>
                                                        <td>{new Date(c.appointmentDate).toLocaleDateString()}</td>
                                                        <td>{c.appointmentTime}</td>
                                                        <td className="text-truncate" style={{ maxWidth: '150px' }}>{c.mainHealthIssue}</td>
                                                        <td>{getStatusBadge(c.status)}</td>
                                                        <td>{c.doctorNotes || '-'}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserConsultationHistory;
