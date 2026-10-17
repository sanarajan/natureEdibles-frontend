import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, MoreHorizontal, Mail, Phone, Filter, Download, UserPlus, Trash2, Edit2, User, Eye } from 'lucide-react';
import apiClient from '../../../services/adminApiClient';
import { toast } from 'react-toastify';
import { formatDate } from '../../../utils/formatDate';
import Swal from 'sweetalert2';
import '../../../styles/admin-pages.css';
import Pagination from '../../../components/Pagination/Pagination';

const AdminCustomers: React.FC = () => {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const openModal = (customer: any) => setSelectedCustomer(customer);
    const closeModal = () => setSelectedCustomer(null);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            fetchCustomers();
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            let endpoint = '/admin/users';
            if (searchTerm) {
                endpoint += `?search=${encodeURIComponent(searchTerm)}`;
            }
            const res = await apiClient.get(endpoint);
            if (res.data.success) {
                setCustomers(res.data.data);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to fetch customers');
        } finally {
            setLoading(false);
        }
    };

    const confirmStatusChange = async (customer: any) => {
        const isCurrentlyActive = customer.isActive;
        const newStatus = !isCurrentlyActive;
        const title = isCurrentlyActive ? 'Deactivate Customer?' : 'Activate Customer?';
        const text = isCurrentlyActive 
            ? 'Are you sure you want to deactivate this customer? This customer will not be able to login until reactivated.' 
            : 'Are you sure you want to activate this customer? This customer will be able to login again.';
        const confirmButtonText = isCurrentlyActive ? 'Deactivate' : 'Activate';
        const confirmButtonColor = isCurrentlyActive ? '#ef4444' : '#22c55e'; // red or green
        const icon = isCurrentlyActive ? 'warning' : 'question';

        const result = await Swal.fire({
            title,
            text,
            icon,
            showCancelButton: true,
            confirmButtonColor,
            cancelButtonColor: '#64748b', // standard cancel color
            confirmButtonText,
            background: '#ffffff',
            customClass: {
                popup: 'admin-swal-popup',
                confirmButton: 'admin-swal-confirm',
                cancelButton: 'admin-swal-cancel'
            }
        });

        if (result.isConfirmed) {
            setCustomers(prev => prev.map(c => c._id === customer._id ? { ...c, isActive: newStatus } : c));
            try {
                const res = await apiClient.patch(`/admin/users/${customer._id}/status`, { isActive: newStatus });
                if (res.data.success) {
                    toast.success(newStatus ? 'Customer activated successfully.' : 'Customer deactivated successfully.');
                }
            } catch (error: any) {
                setCustomers(prev => prev.map(c => c._id === customer._id ? { ...c, isActive: isCurrentlyActive } : c));
                toast.error(error.response?.data?.message || 'Failed to update customer status.');
            }
        }
    };

    const handleDelete = async (id: string) => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this! Only customers with 0 orders can be deleted.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#22c55e',
            cancelButtonColor: '#ef4444',
            confirmButtonText: 'Yes, delete it!',
            background: '#ffffff',
            customClass: {
                popup: 'admin-swal-popup',
                confirmButton: 'admin-swal-confirm',
                cancelButton: 'admin-swal-cancel'
            }
        });

        if (result.isConfirmed) {
            try {
                const res = await apiClient.delete(`/admin/users/${id}`);
                if (res.data.success) {
                    toast.success('Customer deleted successfully');
                    fetchCustomers();
                }
            } catch (error: any) {
                const errorMsg = error.response?.data?.message || 'Failed to delete customer';
                toast.error(errorMsg);
                
                if (errorMsg.includes('orders')) {
                    Swal.fire({
                        title: 'Action Blocked',
                        text: errorMsg,
                        icon: 'error',
                        confirmButtonColor: '#22c55e',
                    });
                }
            }
        }
    };

    const getStatusBadge = (status: boolean) => {
        return status 
            ? <span className="admin-badge badge-success">Active</span> 
            : <span className="admin-badge badge-danger">Inactive</span>;
    };

    const filteredCustomers = customers;
    const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
    const displayedCustomers = filteredCustomers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="admin-page-container">
            <div className="page-header">
                <h1 className="page-title">Customers</h1>
                {/* <div className="header-actions">
                    <button className="btn-primary-admin secondary" style={{ backgroundColor: '#fff', color: '#64748b', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
                        <Download size={18} /> Export List
                    </button>
                    <button className="btn-primary-admin">
                        <UserPlus size={18} /> Add Customer
                    </button>
                </div> */}
            </div>

            <div className="admin-card">
                <div className="card-filter-header">
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input 
                            type="text" 
                            placeholder="Search customers..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="action-btn" title="Filters">
                        <Filter size={18} />
                    </button>
                </div>

                <div className="admin-table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Customer</th>
                                <th>Contact</th>
                                <th>Location</th>
                                <th>Joined Date</th>
                                <th>Orders</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="text-center p-4">Loading customers...</td></tr>
                            ) : displayedCustomers.length === 0 ? (
                                <tr><td colSpan={7} className="text-center p-4">No customers found.</td></tr>
                            ) : (
                                displayedCustomers.map((customer) => (
                                    <tr key={customer._id}>
                                        <td>
                                            <div className="product-info">
                                                {customer.imageUrl ? (
                                                    <img className="product-img" style={{ borderRadius: '50%' }} src={customer.imageUrl} alt={customer.displayName} />
                                                ) : (
                                                    <div className="product-img-placeholder" style={{ width: '48px', height: '48px', backgroundColor: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e2e8f0' }}>
                                                        <User size={24} color="#94a3b8" />
                                                    </div>
                                                )}
                                                <div>
                                                    <div className="product-name">{customer.displayName || 'Unnamed User'}</div>
                                                    <div className="product-category" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <Mail size={12} /> {customer.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                <span style={{ fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <Phone size={12} /> {customer.phoneNumber || 'N/A'}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            {customer.lastLocation 
                                                ? `${customer.lastLocation.city}, ${customer.lastLocation.state}` 
                                                : 'No address'
                                            }
                                        </td>
                                        <td>{formatDate(customer.createdAt)}</td>
                                        <td style={{ fontWeight: 600 }}>{customer.orderCount} orders</td>
                                        <td>
                                            <button 
                                                onClick={() => confirmStatusChange(customer)}
                                                className={`btn btn-sm ${customer.isActive ? 'btn-success' : 'btn-danger'}`}
                                                style={{ borderRadius: '20px', padding: '4px 12px', fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.5px', border: 'none', color: '#fff' }}
                                                title={customer.isActive ? 'Click to deactivate' : 'Click to activate'}
                                            >
                                                {customer.isActive ? 'ACTIVE' : 'INACTIVE'}
                                            </button>
                                        </td>
                                        <td>
                                            <div className="table-actions d-flex align-items-center gap-3">
                                                <button 
                                                    onClick={() => openModal(customer)} 
                                                    className="action-btn" 
                                                    title="View Customer"
                                                    aria-label="View Customer"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
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

            {selectedCustomer && (
                <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={closeModal}>
                    <div className="modal-content admin-card p-4" style={{ width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto', backgroundColor: '#fff', borderRadius: '8px', position: 'relative' }} onClick={e => e.stopPropagation()}>
                        <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-3">
                            <h4 className="mb-0">Customer Details</h4>
                            <button onClick={closeModal} className="btn-close" aria-label="Close" style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', lineHeight: 1 }}>&times;</button>
                        </div>
                        
                        <div className="d-flex flex-column align-items-center mb-4">
                            {selectedCustomer.imageUrl ? (
                                <img 
                                    src={selectedCustomer.imageUrl} 
                                    alt={selectedCustomer.displayName} 
                                    style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover' }} 
                                />
                            ) : (
                                <div style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={50} color="#94a3b8" />
                                </div>
                            )}
                            <h5 className="mt-3 mb-1">{selectedCustomer.displayName || 'Unnamed User'}</h5>
                            {getStatusBadge(selectedCustomer.isActive)}
                        </div>

                        <div className="row g-4 mt-2">
                            <div className="col-12 col-md-6">
                                <div className="text-muted small mb-1">Email Address</div>
                                <div className="fw-medium">{selectedCustomer.email || 'N/A'}</div>
                            </div>
                            <div className="col-12 col-md-6">
                                <div className="text-muted small mb-1">Phone Number</div>
                                <div className="fw-medium">{selectedCustomer.phoneNumber || 'N/A'}</div>
                            </div>
                            <div className="col-12 col-md-6">
                                <div className="text-muted small mb-1">Joined Date</div>
                                <div className="fw-medium">{formatDate(selectedCustomer.createdAt)}</div>
                            </div>
                            <div className="col-12 col-md-6">
                                <div className="text-muted small mb-1">Total Orders</div>
                                <div className="fw-medium">{selectedCustomer.orderCount || 0}</div>
                            </div>
                            <div className="col-12">
                                <div className="text-muted small mb-1">Address</div>
                                <div className="fw-medium">
                                    {selectedCustomer.lastLocation ? (
                                        <>
                                            {selectedCustomer.lastLocation.houseName && <div>{selectedCustomer.lastLocation.houseName}</div>}
                                            {selectedCustomer.lastLocation.street && <div>{selectedCustomer.lastLocation.street}</div>}
                                            {selectedCustomer.lastLocation.city && <span>{selectedCustomer.lastLocation.city}</span>}
                                            {selectedCustomer.lastLocation.district && <span>, {selectedCustomer.lastLocation.district}</span>}
                                            {selectedCustomer.lastLocation.state && <span>, {selectedCustomer.lastLocation.state}</span>}
                                            {selectedCustomer.lastLocation.pinCode && <span> - {selectedCustomer.lastLocation.pinCode}</span>}
                                        </>
                                    ) : 'No address provided'}
                                </div>
                            </div>
                        </div>

                        <div className="text-end mt-4 pt-3 border-top">
                            <button onClick={closeModal} className="btn btn-outline-secondary px-4">Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminCustomers;
