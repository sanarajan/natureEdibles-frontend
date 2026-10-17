import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import adminApiClient from '../../../services/adminApiClient';
import { toast } from 'react-toastify';
import { Loader2, ArrowLeft, User, Mail, Phone, MapPin, Calendar, Activity } from 'lucide-react';
import '../../../styles/admin-pages.css';

const CustomerView: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCustomer();
    }, [id]);

    const fetchCustomer = async () => {
        try {
            setLoading(true);
            const res = await adminApiClient.get('/admin/users');
            if (res.data.success && res.data.data) {
                const foundCustomer = res.data.data.find((c: any) => c._id === id);
                if (foundCustomer) {
                    setCustomer(foundCustomer);
                } else {
                    toast.error('Customer not found.');
                    navigate('/admin/customers');
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch customer');
            navigate('/admin/customers');
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
                <Loader2 className="animate-spin w-8 h-8" style={{ color: '#0ea5e9' }} />
            </div>
        );
    }

    if (!customer) {
        return null;
    }

    return (
        <div className="admin-page-container">
            <div className="page-header d-flex justify-content-between align-items-center mb-4">
                <h1 className="page-title mb-0">Customer Details</h1>
                <Link to="/admin/customers" className="btn btn-outline-secondary d-flex align-items-center gap-2">
                    <ArrowLeft size={16} /> Back to Customers
                </Link>
            </div>

            <div className="admin-card p-4" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div className="d-flex flex-column align-items-center mb-4">
                    {customer.imageUrl ? (
                        <img 
                            src={customer.imageUrl} 
                            alt={customer.displayName} 
                            style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #f1f5f9' }} 
                        />
                    ) : (
                        <div style={{ width: '120px', height: '120px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '4px solid #e2e8f0' }}>
                            <User size={60} color="#94a3b8" />
                        </div>
                    )}
                    <h3 className="mt-3 mb-1" style={{ fontWeight: 600, color: '#1e293b' }}>{customer.displayName || 'Unnamed User'}</h3>
                    <span className={`admin-badge ${customer.isActive ? 'badge-success' : 'badge-danger'}`}>
                        {customer.isActive ? 'Active' : 'Inactive'}
                    </span>
                </div>

                <div className="row g-4 mt-2">
                    <div className="col-md-6">
                        <div className="d-flex align-items-center mb-2 text-muted">
                            <Mail size={18} className="me-2" /> Email Address
                        </div>
                        <div style={{ fontWeight: 500, color: '#334155', paddingLeft: '26px' }}>{customer.email || 'N/A'}</div>
                    </div>

                    <div className="col-md-6">
                        <div className="d-flex align-items-center mb-2 text-muted">
                            <Phone size={18} className="me-2" /> Phone Number
                        </div>
                        <div style={{ fontWeight: 500, color: '#334155', paddingLeft: '26px' }}>{customer.phoneNumber || 'N/A'}</div>
                    </div>

                    <div className="col-md-6">
                        <div className="d-flex align-items-center mb-2 text-muted">
                            <Calendar size={18} className="me-2" /> Joined Date
                        </div>
                        <div style={{ fontWeight: 500, color: '#334155', paddingLeft: '26px' }}>{formatDate(customer.createdAt)}</div>
                    </div>

                    <div className="col-md-6">
                        <div className="d-flex align-items-center mb-2 text-muted">
                            <Activity size={18} className="me-2" /> Total Orders
                        </div>
                        <div style={{ fontWeight: 500, color: '#334155', paddingLeft: '26px' }}>{customer.orderCount || 0}</div>
                    </div>

                    <div className="col-12">
                        <div className="d-flex align-items-center mb-2 text-muted">
                            <MapPin size={18} className="me-2" /> Address
                        </div>
                        <div style={{ fontWeight: 500, color: '#334155', paddingLeft: '26px' }}>
                            {customer.lastLocation ? (
                                <div>
                                    {customer.lastLocation.houseName && <div>{customer.lastLocation.houseName}</div>}
                                    {customer.lastLocation.street && <div>{customer.lastLocation.street}</div>}
                                    {customer.lastLocation.city && <span>{customer.lastLocation.city}</span>}
                                    {customer.lastLocation.district && <span>, {customer.lastLocation.district}</span>}
                                    {customer.lastLocation.state && <span>, {customer.lastLocation.state}</span>}
                                    {customer.lastLocation.pinCode && <span> - {customer.lastLocation.pinCode}</span>}
                                </div>
                            ) : 'No address provided'}
                        </div>
                    </div>
                </div>

                <div className="text-center mt-5 pt-3 border-top">
                    <Link to="/admin/customers" className="btn btn-outline-secondary px-4">
                        Back to Customers
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CustomerView;
