import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import userApiClient from '../../services/userApiClient';
import type { RootState } from '../../store';
import product1 from '../../assets/images/organic/authentic-organic-staples-19.jpeg';
import { handleAddToCartGlobal } from '../../utils/CartHelper';

interface CartSidebarProps {
    activeTab: 'cart' | 'wishlist';
    setActiveTab: (tab: 'cart' | 'wishlist') => void;
}

export const getStockInfo = (prod: any) => {
    if (!prod || prod.isActive === false) {
        return {
            label: 'Unavailable',
            isOutOfStock: true,
            isLowStock: false,
            isUnavailable: true,
            isPurchasable: false,
            color: '#dc3545'
        };
    }
    const stock = prod.stock;
    if (stock === undefined || stock <= 0) {
        return {
            label: 'Out of Stock',
            isOutOfStock: true,
            isLowStock: false,
            isUnavailable: false,
            isPurchasable: false,
            color: '#dc3545'
        };
    }
    if (stock <= 10) {
        return {
            label: `Low Stock (${stock} left)`,
            isOutOfStock: false,
            isLowStock: true,
            isUnavailable: false,
            isPurchasable: true,
            color: '#d97706'
        };
    }
    return {
        label: 'In Stock',
        isOutOfStock: false,
        isLowStock: false,
        isUnavailable: false,
        isPurchasable: true,
        color: '#2e7d32'
    };
};

const CartSidebar: React.FC<CartSidebarProps> = ({ activeTab, setActiveTab }) => {
    const isUser = useSelector((state: RootState) => state.auth.user.isAuthenticated) && !!localStorage.getItem('user_accessToken');
    const navigate = useNavigate();
    const [cartItems, setCartItems] = useState<any[]>([]);
    const [wishlistItems, setWishlistItems] = useState<any[]>([]);

    const handleNavigate = (path: string) => {
        handleCloseOffcanvas();
        navigate(path);
    };

    const handleCloseOffcanvas = () => {
        const offcanvas = document.getElementById('offcanvasRight');
        if (offcanvas) {
            try {
                const bsOffcanvas = (window as any).bootstrap?.Offcanvas.getInstance(offcanvas) || 
                                   new (window as any).bootstrap.Offcanvas(offcanvas);
                bsOffcanvas.hide();
            } catch (e) {
                offcanvas.classList.remove('show');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
                const backdrop = document.querySelector('.offcanvas-backdrop');
                if (backdrop) backdrop.remove();
            }
        }
    };

    const fetchCartAndWishlist = useCallback(async () => {
        if (isUser) {
            try {
                const [cartRes, wishRes] = await Promise.all([
                    userApiClient.get('/user/cart'),
                    userApiClient.get('/user/wishlist')
                ]);
                if (cartRes.data.success && cartRes.data.data) {
                    setCartItems(cartRes.data.data.products || []);
                }
                if (wishRes.data.success) {
                    setWishlistItems(wishRes.data.data || []);
                }
            } catch (err) {
                console.error("Failed to fetch sidebar items", err);
            }
        } else {
            const localCartStr = localStorage.getItem('offlineCart');
            if (localCartStr) {
                try { setCartItems(JSON.parse(localCartStr)); } catch (e) { setCartItems([]); }
            } else setCartItems([]);

            const localWishlistStr = localStorage.getItem('offlineWishlist');
            if (localWishlistStr) {
                try { setWishlistItems(JSON.parse(localWishlistStr)); } catch (e) { setWishlistItems([]); }
            } else setWishlistItems([]);
        }
    }, [isUser]);

    useEffect(() => {
        fetchCartAndWishlist();

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'offlineCart' || e.key === 'offlineWishlist' || e.key === 'user_accessToken') {
                fetchCartAndWishlist();
            }
        };

        const handleCustomUpdate = (e: Event) => {
            const customEvt = e as CustomEvent;
            // Prevent immediate background refetch if this event originated from sidebar's optimistic local update
            if (customEvt?.detail?.source === 'sidebar') {
                return;
            }
            fetchCartAndWishlist();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('cart-updated', handleCustomUpdate);
        window.addEventListener('wishlist-updated', handleCustomUpdate);

        const offcanvasEl = document.getElementById('offcanvasRight');
        if (offcanvasEl) {
            offcanvasEl.addEventListener('show.bs.offcanvas', fetchCartAndWishlist);
        }

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('cart-updated', handleCustomUpdate);
            window.removeEventListener('wishlist-updated', handleCustomUpdate);
            if (offcanvasEl) {
                offcanvasEl.removeEventListener('show.bs.offcanvas', fetchCartAndWishlist);
            }
        };
    }, [fetchCartAndWishlist]);

    useEffect(() => {
        fetchCartAndWishlist();
    }, [activeTab, fetchCartAndWishlist]);

    const updateQty = async (productId: string, delta: number) => {
        const item = cartItems.find(i => (i.product?._id || i.product) === productId);
        if (!item || !item.product) return;
        const prod = item.product;
        const stockInfo = getStockInfo(prod);

        // If not purchasable (stock 0 or inactive), do not allow increasing
        if (!stockInfo.isPurchasable && delta > 0) return;

        const availableStock = prod.stock !== undefined ? prod.stock : 9999;
        if (delta > 0 && item.quantity >= availableStock) return;

        const targetQty = item.quantity + delta;
        if (targetQty < 1) return;

        const newQty = prod.stock !== undefined ? Math.min(targetQty, prod.stock) : targetQty;
        if (newQty === item.quantity && delta > 0) return;

        // Optimistically update
        const newItems = cartItems.map(i => 
            (i.product?._id === productId || i.product === productId) ? { ...i, quantity: newQty } : i
        );
        setCartItems(newItems);
        window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: newItems.length, source: 'sidebar' } }));

        if (isUser) {
            try {
                await userApiClient.put('/user/cart/update', { productId, quantity: newQty });
            } catch (err) {
                console.error("Failed to update cart quantity", err);
                fetchCartAndWishlist();
            }
        } else {
            localStorage.setItem('offlineCart', JSON.stringify(newItems));
        }
    };

    const removeCartItem = async (productId: string) => {
        const newItems = cartItems.filter(i => (i.product?._id || i.product) !== productId);
        setCartItems(newItems);
        window.dispatchEvent(new CustomEvent('cart-updated', { detail: { count: newItems.length, source: 'sidebar' } }));

        if (isUser) {
            try {
                await userApiClient.delete(`/user/cart/${productId}`);
            } catch (err) {
                console.error("Failed to remove cart item", err);
                fetchCartAndWishlist();
            }
        } else {
            localStorage.setItem('offlineCart', JSON.stringify(newItems));
        }
    };

    const removeWishlistItem = async (productId: string) => {
        const newItems = wishlistItems.filter(i => (i._id || i) !== productId);
        setWishlistItems(newItems);
        window.dispatchEvent(new CustomEvent('wishlist-updated', { detail: { count: newItems.length, source: 'sidebar' } }));

        if (isUser) {
            try {
                await userApiClient.post('/user/wishlist/toggle', { productId });
            } catch (err) {
                console.error("Failed to remove wishlist item", err);
                fetchCartAndWishlist();
            }
        } else {
            localStorage.setItem('offlineWishlist', JSON.stringify(newItems));
        }
    };

    const handleAddToCartFromWishlist = async (prod: any) => {
        const stockInfo = getStockInfo(prod);
        if (!stockInfo.isPurchasable) return;

        await handleAddToCartGlobal(prod, 1, isUser, navigate, false);
        fetchCartAndWishlist();
    };

    const validCartItems = cartItems.filter(item => item && item.product);
    const cartSubtotal = validCartItems.reduce((acc, item) => {
        const prod = item.product;
        const unitPrice = (prod?.offerPrice && prod.offerPrice > 0) ? prod.offerPrice : (prod?.price || 0);
        return acc + (unitPrice * (item.quantity || 1));
    }, 0);
    const hasInvalidItems = validCartItems.some(i => {
        const prod = i.product;
        if (!prod || prod.isActive === false) return true;
        if (prod.stock !== undefined && (prod.stock <= 0 || i.quantity > prod.stock)) return true;
        return false;
    });

    return (
        <div className="offcanvas dz-offcanvas offcanvas-end" tabIndex={-1} id="offcanvasRight" style={{ width: '430px', maxWidth: '100vw' }}>
            {/* Custom Close Button */}
            <button
                type="button"
                className="btn-close-custom"
                data-bs-dismiss="offcanvas"
                aria-label="Close"
                onClick={handleCloseOffcanvas}
                style={{
                    position: 'absolute',
                    top: '20px',
                    right: '24px',
                    zIndex: 10,
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    color: '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                    transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#F1F5F9';
                    e.currentTarget.style.color = '#1E293B';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#FFFFFF';
                    e.currentTarget.style.color = '#64748B';
                }}
            >
                <i className="fa-solid fa-xmark" style={{ fontSize: '15px' }}></i>
            </button>

            <div className="offcanvas-body d-flex flex-column" style={{ padding: '24px 28px', height: '100%', background: '#F4FBF7' }}>
                <div className="dz-tabs d-flex flex-column h-100">
                    {/* Modern Tab Switcher */}
                    <div style={{ display: 'flex', background: '#EEF5F1', borderRadius: '10px', padding: '4px', marginBottom: '20px', width: 'calc(100% - 40px)' }}>
                        <button
                            type="button"
                            onClick={() => setActiveTab('cart')}
                            style={{
                                flex: 1,
                                padding: '9px 12px',
                                border: 'none',
                                borderRadius: '8px',
                                background: activeTab === 'cart' ? '#FFFFFF' : 'transparent',
                                color: activeTab === 'cart' ? '#0D775E' : '#64748B',
                                fontWeight: activeTab === 'cart' ? 600 : 500,
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                boxShadow: activeTab === 'cart' ? '0 2px 6px rgba(13, 119, 94, 0.12)' : 'none',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <span>Shopping Cart</span>
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 7px',
                                borderRadius: '12px',
                                background: activeTab === 'cart' ? '#0D775E' : '#E2E8F0',
                                color: activeTab === 'cart' ? '#FFFFFF' : '#475569'
                            }}>
                                {validCartItems.length}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab('wishlist')}
                            style={{
                                flex: 1,
                                padding: '9px 12px',
                                border: 'none',
                                borderRadius: '8px',
                                background: activeTab === 'wishlist' ? '#FFFFFF' : 'transparent',
                                color: activeTab === 'wishlist' ? '#0D775E' : '#64748B',
                                fontWeight: activeTab === 'wishlist' ? 600 : 500,
                                fontSize: '14px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                boxShadow: activeTab === 'wishlist' ? '0 2px 6px rgba(13, 119, 94, 0.12)' : 'none',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            <span>Wishlist</span>
                            <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 7px',
                                borderRadius: '12px',
                                background: activeTab === 'wishlist' ? '#0D775E' : '#E2E8F0',
                                color: activeTab === 'wishlist' ? '#FFFFFF' : '#475569'
                            }}>
                                {wishlistItems.length}
                            </span>
                        </button>
                    </div>

                    <div className="tab-content flex-grow-1 d-flex flex-column" style={{ minHeight: 0, overflow: 'hidden' }}>
                        <div className="flex-grow-1" style={{ overflowY: 'auto', paddingRight: '4px' }}>
                            <ul className="sidebar-cart-list" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                                {activeTab === 'cart' ? (
                                    validCartItems.length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
                                            <div style={{
                                                width: '64px',
                                                height: '64px',
                                                borderRadius: '50%',
                                                background: '#EEF5F1',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginBottom: '16px'
                                            }}>
                                                <i className="fa-solid fa-cart-shopping" style={{ fontSize: '24px', color: '#0D775E' }}></i>
                                            </div>
                                            <h5 style={{ fontFamily: "'Marcellus', serif", fontSize: '19px', color: '#2D2E2F', marginBottom: '8px' }}>
                                                Your Cart is Empty
                                            </h5>
                                            <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '240px', margin: '0 auto 20px', lineHeight: '1.4' }}>
                                                Explore our authentic organic products and add your favorites to cart.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => handleNavigate('/shop')}
                                                className="btn btn-secondary"
                                                style={{
                                                    background: '#0D775E',
                                                    borderColor: '#0D775E',
                                                    fontSize: '13.5px',
                                                    padding: '9px 24px',
                                                    borderRadius: '6px',
                                                    fontWeight: 500
                                                }}
                                            >
                                                Start Shopping
                                            </button>
                                        </div>
                                    ) : (
                                        validCartItems.map((item, idx) => {
                                            const prod = item.product;
                                            const stockInfo = getStockInfo(prod);
                                            const isItemDisabled = !stockInfo.isPurchasable;
                                            const isAtMaxStock = prod.stock !== undefined && item.quantity >= prod.stock;
                                            const isAtMinStock = item.quantity <= 1;
                                            const isExceedingStock = prod.stock !== undefined && prod.stock > 0 && item.quantity > prod.stock;

                                            const unitPrice = (prod.offerPrice && prod.offerPrice > 0) ? prod.offerPrice : (prod.price || 0);
                                            const hasOffer = prod.offerPrice && prod.offerPrice > 0 && prod.offerPrice < prod.price;

                                            return (
                                                <li
                                                    key={prod?._id || `cart-item-${idx}`}
                                                    style={{
                                                        padding: '14px',
                                                        borderRadius: '10px',
                                                        background: '#FFFFFF',
                                                        border: isExceedingStock || isItemDisabled ? '1px solid #FCA5A5' : '1px solid #E6ECE8',
                                                        marginBottom: '12px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        position: 'relative',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                                                        transition: 'border-color 0.2s ease'
                                                    }}
                                                >
                                                    {/* Product Image */}
                                                    <div
                                                        style={{
                                                            width: '74px',
                                                            height: '80px',
                                                            borderRadius: '8px',
                                                            background: '#F4F7F5',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexShrink: 0,
                                                            marginRight: '14px',
                                                            overflow: 'hidden',
                                                            cursor: 'pointer'
                                                        }}
                                                        onClick={() => handleNavigate(`/product/${prod._id}`)}
                                                    >
                                                        <img
                                                            src={prod.images?.[0] || product1}
                                                            alt={prod.productName}
                                                            style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }}
                                                        />
                                                    </div>

                                                    {/* Product Details */}
                                                    <div className="cart-content flex-grow-1" style={{ minWidth: 0, paddingRight: '22px' }}>
                                                        <h6
                                                            className="title"
                                                            style={{
                                                                fontFamily: "'Marcellus', serif",
                                                                fontSize: '15px',
                                                                fontWeight: '500',
                                                                color: '#2D2E2F',
                                                                marginBottom: '3px',
                                                                lineHeight: '1.3',
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden'
                                                            }}
                                                        >
                                                            <Link
                                                                to={`/product/${prod._id}`}
                                                                onClick={handleCloseOffcanvas}
                                                                style={{ color: '#2D2E2F', textDecoration: 'none' }}
                                                            >
                                                                {prod.productName}
                                                            </Link>
                                                        </h6>

                                                        {/* Subtle Stock Indicator */}
                                                        <div
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '5px',
                                                                fontSize: '11.5px',
                                                                fontWeight: 500,
                                                                color: stockInfo.color,
                                                                marginBottom: '8px'
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    width: '6px',
                                                                    height: '6px',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: stockInfo.color,
                                                                    display: 'inline-block',
                                                                    flexShrink: 0
                                                                }}
                                                            />
                                                            <span>{stockInfo.label}</span>
                                                            {isExceedingStock && (
                                                                <span style={{ color: '#DC2626', fontSize: '11px', fontWeight: 600, marginLeft: '4px' }}>
                                                                    (In cart: {item.quantity})
                                                                </span>
                                                            )}
                                                        </div>

                                                        {/* Controls: Quantity + Price */}
                                                        <div className="d-flex align-items-center justify-content-between" style={{ marginTop: '2px' }}>
                                                            <div
                                                                style={{
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    border: '1px solid #D1D5DB',
                                                                    borderRadius: '5px',
                                                                    overflow: 'hidden',
                                                                    background: '#FFFFFF',
                                                                    height: '26px'
                                                                }}
                                                            >
                                                                <button
                                                                    disabled={isItemDisabled || isAtMinStock}
                                                                    onClick={() => updateQty(prod._id, -1)}
                                                                    type="button"
                                                                    aria-label="Decrease quantity"
                                                                    style={{
                                                                        width: '26px',
                                                                        height: '26px',
                                                                        background: (isItemDisabled || isAtMinStock) ? '#F9FAFB' : '#FFFFFF',
                                                                        border: 'none',
                                                                        color: (isItemDisabled || isAtMinStock) ? '#CBD5E1' : '#374151',
                                                                        cursor: (isItemDisabled || isAtMinStock) ? 'not-allowed' : 'pointer',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center'
                                                                    }}
                                                                >
                                                                    <i className="fa-solid fa-minus" style={{ fontSize: '9px' }}></i>
                                                                </button>
                                                                <span
                                                                    style={{
                                                                        width: '28px',
                                                                        height: '26px',
                                                                        borderLeft: '1px solid #E5E7EB',
                                                                        borderRight: '1px solid #E5E7EB',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center',
                                                                        fontSize: '12px',
                                                                        fontWeight: 600,
                                                                        color: '#1F2937',
                                                                        background: '#FFFFFF'
                                                                    }}
                                                                >
                                                                    {item.quantity}
                                                                </span>
                                                                <button
                                                                    disabled={isItemDisabled || isAtMaxStock}
                                                                    onClick={() => updateQty(prod._id, 1)}
                                                                    type="button"
                                                                    aria-label="Increase quantity"
                                                                    style={{
                                                                        width: '26px',
                                                                        height: '26px',
                                                                        background: (isItemDisabled || isAtMaxStock) ? '#F9FAFB' : '#FFFFFF',
                                                                        border: 'none',
                                                                        color: (isItemDisabled || isAtMaxStock) ? '#CBD5E1' : '#374151',
                                                                        cursor: (isItemDisabled || isAtMaxStock) ? 'not-allowed' : 'pointer',
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        justifyContent: 'center'
                                                                    }}
                                                                >
                                                                    <i className="fa-solid fa-plus" style={{ fontSize: '9px' }}></i>
                                                                </button>
                                                            </div>

                                                            <div className="text-end" style={{ marginLeft: '10px' }}>
                                                                <span style={{ fontSize: '15px', fontWeight: '600', color: '#0D775E' }}>
                                                                    ₹{(unitPrice * item.quantity).toFixed(2)}
                                                                </span>
                                                                {hasOffer && (
                                                                    <del style={{ fontSize: '11px', color: '#9CA3AF', marginLeft: '6px' }}>
                                                                        ₹{((prod.price || 0) * item.quantity).toFixed(2)}
                                                                    </del>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Remove Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeCartItem(prod._id)}
                                                        aria-label="Remove item"
                                                        style={{
                                                            position: 'absolute',
                                                            right: '10px',
                                                            top: '10px',
                                                            width: '22px',
                                                            height: '22px',
                                                            borderRadius: '50%',
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: '#9CA3AF',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.15s ease'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = '#FEE2E2';
                                                            e.currentTarget.style.color = '#EF4444';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = 'transparent';
                                                            e.currentTarget.style.color = '#9CA3AF';
                                                        }}
                                                    >
                                                        <i className="fa-solid fa-xmark" style={{ fontSize: '13px' }}></i>
                                                    </button>
                                                </li>
                                            );
                                        })
                                    )
                                ) : (
                                    wishlistItems.filter(p => p).length === 0 ? (
                                        <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
                                            <div style={{
                                                width: '64px',
                                                height: '64px',
                                                borderRadius: '50%',
                                                background: '#EEF5F1',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                marginBottom: '16px'
                                            }}>
                                                <i className="fa-regular fa-heart" style={{ fontSize: '24px', color: '#0D775E' }}></i>
                                            </div>
                                            <h5 style={{ fontFamily: "'Marcellus', serif", fontSize: '19px', color: '#2D2E2F', marginBottom: '8px' }}>
                                                Your Wishlist is Empty
                                            </h5>
                                            <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '240px', margin: '0 auto 20px', lineHeight: '1.4' }}>
                                                Save items you love here to easily find and purchase them later.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => handleNavigate('/shop')}
                                                className="btn btn-secondary"
                                                style={{
                                                    background: '#0D775E',
                                                    borderColor: '#0D775E',
                                                    fontSize: '13.5px',
                                                    padding: '9px 24px',
                                                    borderRadius: '6px',
                                                    fontWeight: 500
                                                }}
                                            >
                                                Explore Products
                                            </button>
                                        </div>
                                    ) : (
                                        wishlistItems.filter(p => p).map((prod, idx) => {
                                            const stockInfo = getStockInfo(prod);
                                            const isPurchasable = stockInfo.isPurchasable;
                                            const unitPrice = (prod.offerPrice && prod.offerPrice > 0) ? prod.offerPrice : (prod.price || 0);
                                            const hasOffer = prod.offerPrice && prod.offerPrice > 0 && prod.offerPrice < prod.price;

                                            return (
                                                <li
                                                    key={prod._id || `wish-${idx}`}
                                                    style={{
                                                        padding: '14px',
                                                        borderRadius: '10px',
                                                        background: '#FFFFFF',
                                                        border: '1px solid #E6ECE8',
                                                        marginBottom: '12px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        position: 'relative',
                                                        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                                                        transition: 'border-color 0.2s ease'
                                                    }}
                                                >
                                                    {/* Product Image */}
                                                    <div
                                                        style={{
                                                            width: '74px',
                                                            height: '80px',
                                                            borderRadius: '8px',
                                                            background: '#F4F7F5',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            flexShrink: 0,
                                                            marginRight: '14px',
                                                            overflow: 'hidden',
                                                            cursor: 'pointer'
                                                        }}
                                                        onClick={() => handleNavigate(`/product/${prod._id}`)}
                                                    >
                                                        <img
                                                            src={prod.images?.[0] || product1}
                                                            alt={prod.productName}
                                                            style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }}
                                                        />
                                                    </div>

                                                    {/* Product Details */}
                                                    <div className="cart-content flex-grow-1" style={{ minWidth: 0, paddingRight: '22px' }}>
                                                        <h6
                                                            className="title"
                                                            style={{
                                                                fontFamily: "'Marcellus', serif",
                                                                fontSize: '15px',
                                                                fontWeight: '500',
                                                                color: '#2D2E2F',
                                                                marginBottom: '3px',
                                                                lineHeight: '1.3',
                                                                display: '-webkit-box',
                                                                WebkitLineClamp: 2,
                                                                WebkitBoxOrient: 'vertical',
                                                                overflow: 'hidden'
                                                            }}
                                                        >
                                                            <Link
                                                                to={`/product/${prod._id}`}
                                                                onClick={handleCloseOffcanvas}
                                                                style={{ color: '#2D2E2F', textDecoration: 'none' }}
                                                            >
                                                                {prod.productName}
                                                            </Link>
                                                        </h6>

                                                        {/* Subtle Stock Indicator */}
                                                        <div
                                                            style={{
                                                                display: 'inline-flex',
                                                                alignItems: 'center',
                                                                gap: '5px',
                                                                fontSize: '11.5px',
                                                                fontWeight: 500,
                                                                color: stockInfo.color,
                                                                marginBottom: '8px'
                                                            }}
                                                        >
                                                            <span
                                                                style={{
                                                                    width: '6px',
                                                                    height: '6px',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: stockInfo.color,
                                                                    display: 'inline-block',
                                                                    flexShrink: 0
                                                                }}
                                                            />
                                                            <span>{stockInfo.label}</span>
                                                        </div>

                                                        {/* Price and Add to Cart Action */}
                                                        <div className="d-flex align-items-center justify-content-between" style={{ marginTop: '2px' }}>
                                                            <div>
                                                                <span style={{ fontSize: '15px', fontWeight: '600', color: '#0D775E' }}>
                                                                    ₹{unitPrice.toFixed(2)}
                                                                </span>
                                                                {hasOffer && (
                                                                    <del style={{ fontSize: '11px', color: '#9CA3AF', marginLeft: '6px' }}>
                                                                        ₹{(prod.price || 0).toFixed(2)}
                                                                    </del>
                                                                )}
                                                            </div>

                                                            <button
                                                                disabled={!isPurchasable}
                                                                onClick={() => handleAddToCartFromWishlist(prod)}
                                                                type="button"
                                                                style={{
                                                                    fontSize: '11.5px',
                                                                    padding: '5px 12px',
                                                                    borderRadius: '5px',
                                                                    background: !isPurchasable ? '#F3F4F6' : '#0D775E',
                                                                    color: !isPurchasable ? '#9CA3AF' : '#FFFFFF',
                                                                    border: !isPurchasable ? '1px solid #E5E7EB' : 'none',
                                                                    fontWeight: 500,
                                                                    cursor: !isPurchasable ? 'not-allowed' : 'pointer',
                                                                    display: 'inline-flex',
                                                                    alignItems: 'center',
                                                                    gap: '5px',
                                                                    transition: 'all 0.15s ease'
                                                                }}
                                                                onMouseEnter={(e) => {
                                                                    if (isPurchasable) e.currentTarget.style.background = '#095c48';
                                                                }}
                                                                onMouseLeave={(e) => {
                                                                    if (isPurchasable) e.currentTarget.style.background = '#0D775E';
                                                                }}
                                                            >
                                                                <i className="fa-solid fa-cart-shopping" style={{ fontSize: '10px' }}></i>
                                                                <span>{!isPurchasable ? (stockInfo.isUnavailable ? 'Unavailable' : 'Out of Stock') : 'Add to Cart'}</span>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    {/* Remove Button */}
                                                    <button
                                                        type="button"
                                                        onClick={() => removeWishlistItem(prod._id)}
                                                        aria-label="Remove item"
                                                        style={{
                                                            position: 'absolute',
                                                            right: '10px',
                                                            top: '10px',
                                                            width: '22px',
                                                            height: '22px',
                                                            borderRadius: '50%',
                                                            background: 'transparent',
                                                            border: 'none',
                                                            color: '#9CA3AF',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            cursor: 'pointer',
                                                            transition: 'all 0.15s ease'
                                                        }}
                                                        onMouseEnter={(e) => {
                                                            e.currentTarget.style.background = '#FEE2E2';
                                                            e.currentTarget.style.color = '#EF4444';
                                                        }}
                                                        onMouseLeave={(e) => {
                                                            e.currentTarget.style.background = 'transparent';
                                                            e.currentTarget.style.color = '#9CA3AF';
                                                        }}
                                                    >
                                                        <i className="fa-solid fa-xmark" style={{ fontSize: '13px' }}></i>
                                                    </button>
                                                </li>
                                            );
                                        })
                                    )
                                )}
                            </ul>
                        </div>

                        {/* Footer Section */}
                        <div className="cart-footer mt-auto pt-3" style={{ borderTop: '1px solid #E5E7EB', background: '#F4FBF7' }}>
                            {activeTab === 'cart' ? (
                                validCartItems.length > 0 ? (
                                    <>
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <span style={{ fontFamily: "'Marcellus', serif", fontSize: '18px', fontWeight: '500', color: '#2D2E2F' }}>
                                                Subtotal:
                                            </span>
                                            <span style={{ fontWeight: '700', fontSize: '19px', color: '#0D775E' }}>
                                                ₹{cartSubtotal.toFixed(2)}
                                            </span>
                                        </div>

                                        {hasInvalidItems && (
                                            <div style={{ fontSize: '12px', color: '#DC2626', marginBottom: '10px', textAlign: 'center', fontWeight: 500 }}>
                                                <i className="fa-solid fa-triangle-exclamation me-1"></i> Some items have stock issues. Review cart before checkout.
                                            </div>
                                        )}

                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (hasInvalidItems) {
                                                    handleNavigate('/shop-cart');
                                                } else {
                                                    handleNavigate('/checkout');
                                                }
                                            }}
                                            className="btn btn-secondary btn-block w-100 mb-2"
                                            style={{
                                                background: '#0D775E',
                                                borderColor: '#0D775E',
                                                borderRadius: '6px',
                                                padding: '11px',
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                textTransform: 'none'
                                            }}
                                        >
                                            Proceed to Checkout
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleNavigate('/shop-cart')}
                                            className="btn btn-outline-secondary btn-block w-100"
                                            style={{
                                                borderRadius: '6px',
                                                padding: '9px',
                                                fontSize: '13.5px',
                                                fontWeight: 500,
                                                textTransform: 'none',
                                                color: '#4B5563',
                                                borderColor: '#D1D5DB'
                                            }}
                                        >
                                            View Cart
                                        </button>
                                    </>
                                ) : null
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => handleNavigate('/wishlist')}
                                    className="btn btn-secondary btn-block w-100"
                                    style={{
                                        borderRadius: '6px',
                                        padding: '11px',
                                        fontSize: '15px',
                                        textTransform: 'none',
                                        background: '#2D2E2F',
                                        borderColor: '#2D2E2F',
                                        color: '#fff',
                                        fontFamily: "'Marcellus', serif",
                                        fontWeight: '500'
                                    }}
                                >
                                    View Full Wishlist
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartSidebar;
