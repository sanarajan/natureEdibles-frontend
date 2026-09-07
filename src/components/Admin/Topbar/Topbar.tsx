import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { adminLogout } from '../../../store/authSlice';
import { adminAuthService } from '../../../services/admin/adminAuthService';
import type { RootState } from '../../../store';
import noimage from '../../../assets/images/organic/authentic-organic-staples-14.jpeg';
import {
    Search,
    Sun,
    Grid,
    Languages,
    Bell,
    ChevronDown,
    LogOut,
    User
} from 'lucide-react';
import { getAdminNotifications, markAdminNotificationAsRead } from '../../../services/api/adminNotificationApi';
import type { Notification } from '../../../services/api/notificationApi';
import './Topbar.css';

const Topbar: React.FC = () => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const adminData = useSelector((state: RootState) => state.auth.admin.data);
    const adminName = adminData?.name || adminData?.displayName || 'Admin';
    const adminEmail = adminData?.email || 'admin@naturaledibles.in';
    const adminPhoto = adminData?.imageUrl || noimage;

    const handleLogout = () => {
        setIsDropdownOpen(false);
        toast(
            ({ closeToast }) => (
                <div style={{ textAlign: 'center', padding: '10px' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#333', fontSize: '1.2rem', fontWeight: 600 }}>Ready to leave?</h4>
                    <p style={{ margin: '0 0 20px 0', fontSize: '0.9rem', color: '#666' }}>You are about to securely log out of the admin panel.</p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button
                            onClick={async () => {
                                closeToast();
                                try {
                                    await adminAuthService.logout();
                                    dispatch(adminLogout());
                                    toast.success('Successfully logged out!');
                                    navigate('/admin');
                                } catch (error) {
                                    toast.error('Logout failed. Please try again.');
                                }
                            }}
                            style={{ padding: '8px 16px', background: '#ff4d4f', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, flex: 1 }}
                        >
                            Yes, log out
                        </button>
                        <button
                            onClick={closeToast as any}
                            style={{ padding: '8px 16px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, flex: 1 }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ),
            {
                position: "top-center",
                autoClose: false,
                closeOnClick: false,
                draggable: false,
                closeButton: false,
                toastId: "logout-confirm"
            }
        );
    };

    React.useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const res = await getAdminNotifications();
                if (res.success && res.data) {
                    setNotifications(res.data.notifications || []);
                    setUnreadNotificationCount(res.data.unreadCount || 0);
                }
            } catch (error) {
                console.error("Failed to fetch admin notifications", error);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.isRead) {
            try {
                await markAdminNotificationAsRead(notification._id);
                setNotifications(notifications.map(n => n._id === notification._id ? { ...n, isRead: true } : n));
                setUnreadNotificationCount(prev => Math.max(0, prev - 1));
            } catch (error) {
                console.error("Failed to mark notification as read", error);
            }
        }
        
        setIsNotificationOpen(false);
        if (notification.type === 'NEW_CONSULTATION_BOOKING') {
            navigate('/admin/consultations');
        }
    };

    return (
        <header className="admin-topbar">
            <div className="topbar-left">
                <div className="topbar-search">
                    <div className="search-wrapper">
                        <Search size={18} className="search-icon" />
                        <input type="text" placeholder="Type for search..." />
                    </div>
                </div>
            </div>

            <div className="topbar-right">
                <div className="topbar-actions">
                    <button className="action-btn">
                        <Search size={20} />
                    </button>
                    <button className="action-btn">
                        <Sun size={20} />
                    </button>
                    <button className="action-btn">
                        <Grid size={20} />
                    </button>
                    <button className="action-btn">
                        <Languages size={20} />
                    </button>
                    <div style={{ position: 'relative' }}>
                        <button className="action-btn" onClick={() => setIsNotificationOpen(!isNotificationOpen)}>
                            <Bell size={20} />
                            {unreadNotificationCount > 0 && (
                                <span className="badge">{unreadNotificationCount}</span>
                            )}
                        </button>
                        
                        {isNotificationOpen && (
                            <div style={{
                                position: 'absolute', top: '100%', right: 0, marginTop: '10px',
                                background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)', width: '320px', maxHeight: '400px', 
                                overflowY: 'auto', zIndex: 100
                            }}>
                                <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9', fontWeight: 'bold', position: 'sticky', top: 0, backgroundColor: '#f9f9f9', zIndex: 1 }}>
                                    Notifications
                                </div>
                                {notifications.length === 0 ? (
                                    <div style={{ padding: '16px', textAlign: 'center', color: '#64748b' }}>No new notifications</div>
                                ) : (
                                    notifications.map((notification) => (
                                        <div 
                                            key={notification._id} 
                                            onClick={() => handleNotificationClick(notification)}
                                            style={{ 
                                                padding: '12px 16px', 
                                                borderBottom: '1px solid #f1f5f9', 
                                                cursor: 'pointer',
                                                backgroundColor: notification.isRead ? '#ffffff' : '#f0fdf4'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                                                <strong style={{ fontSize: '14px', color: '#333' }}>{notification.title}</strong>
                                                {!notification.isRead && <span style={{ width: '8px', height: '8px', backgroundColor: '#0D775E', borderRadius: '50%', marginTop: '6px' }}></span>}
                                            </div>
                                            <p style={{ margin: '0 0 4px 0', fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>{notification.message}</p>
                                            <small style={{ fontSize: '11px', color: '#94a3b8' }}>
                                                {new Date(notification.createdAt).toLocaleDateString()} {new Date(notification.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </small>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="user-profile" onClick={() => setIsDropdownOpen(!isDropdownOpen)} style={{ cursor: 'pointer', position: 'relative' }}>
                    <div className="user-avatar">
                        <img src={adminPhoto} alt={adminName} />
                    </div>
                    <div className="user-info">
                        <span className="user-name">{adminName}</span>
                        <span className="user-role">Store Owner</span>
                    </div>
                    <ChevronDown size={14} className="dropdown-arrow" />

                    {isDropdownOpen && (
                        <div style={{
                            position: 'absolute', top: '100%', right: 0, marginTop: '10px',
                            background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.1)', minWidth: '200px', zIndex: 100
                        }}>
                            <div style={{ padding: '16px', borderBottom: '1px solid #f1f5f9' }}>
                                <div style={{ fontWeight: 600, color: '#1e293b' }}>{adminName}</div>
                                <div style={{ fontSize: '13px', color: '#64748b' }}>{adminEmail}</div>
                            </div>
                            <div style={{ padding: '8px' }}>
                                <button
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        navigate('/admin/profile');
                                    }}
                                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'none', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#475569', textAlign: 'left' }}
                                    className="dropdown-item-hover"
                                >
                                    <User size={16} /> My Profile
                                </button>
                                <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: 'none', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#ef4444', textAlign: 'left' }} className="dropdown-item-hover">
                                    <LogOut size={16} /> Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Topbar;
