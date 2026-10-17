import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import userApiClient from '../../services/userApiClient';
import { toast } from 'react-toastify';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { RootState } from '../../store';
import { handleAddToCartGlobal } from '../../utils/CartHelper';

const Wishlist: React.FC = () => {
    const navigate = useNavigate();
    const [wishlistItems, setWishlistItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    const isUser = useSelector((state: RootState) => state.auth.user.isAuthenticated) && !!localStorage.getItem('user_accessToken');

    const fetchWishlist = async () => {
        setLoading(true);
        try {
            let rawItems: any[] = [];
            if (!isUser) {
                const localWishlistStr = localStorage.getItem('offlineWishlist');
                if (localWishlistStr) {
                    try {
                        const parsed = JSON.parse(localWishlistStr);
                        if (Array.isArray(parsed)) {
                            rawItems = parsed.filter(Boolean);
                        }
                    } catch (err) {
                        console.error('Error parsing local wishlist:', err);
                        rawItems = [];
                    }
                }
            } else {
                const res = await userApiClient.get('/user/wishlist');
                if (res.data?.success && Array.isArray(res.data.data)) {
                    rawItems = res.data.data.filter(Boolean);
                }
            }

            // Fetch live product availability using existing frontend product endpoint
            const updatedItems = await Promise.all(
                rawItems.map(async (item: any) => {
                    if (!item || !item._id) {
                        return { ...item, isActive: false, stock: 0 };
                    }
                    try {
                        const prodRes = await userApiClient.get(`/user/products/${item._id}`);
                        if (prodRes.data?.success && prodRes.data?.data) {
                            const fresh = prodRes.data.data;
                            return {
                                ...item,
                                ...fresh,
                                stock: fresh.stock !== undefined ? fresh.stock : 0,
                                isActive: fresh.isActive !== false
                            };
                        }
                    } catch (err: any) {
                        // Product is inactive or deleted from catalog
                        if (err.response?.status === 404) {
                            return {
                                ...item,
                                isActive: false,
                                stock: 0
                            };
                        }
                    }
                    return item;
                })
            );

            setWishlistItems(updatedItems);

            // Update quantity state and ensure it does not exceed available stock
            setQuantities(prev => {
                const updated: Record<string, number> = { ...prev };
                updatedItems.forEach((it: any) => {
                    const avail = it.stock !== undefined ? Math.max(0, it.stock) : 0;
                    const isPurchasable = it.isActive !== false && avail > 0;
                    if (!isPurchasable) {
                        updated[it._id] = 0;
                    } else {
                        const existingQty = updated[it._id] || 1;
                        updated[it._id] = Math.min(existingQty, avail);
                    }
                });
                return updated;
            });

            if (!isUser) {
                localStorage.setItem('offlineWishlist', JSON.stringify(updatedItems));
            }
        } catch (err) {
            console.error('Error fetching wishlist:', err);
            toast.error('Failed to load wishlist');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWishlist();

        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'offlineWishlist') {
                fetchWishlist();
            }
        };
        const handleCustomUpdate = () => {
            fetchWishlist();
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('wishlist-updated', handleCustomUpdate);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('wishlist-updated', handleCustomUpdate);
        };
    }, [isUser]);

    const handleRemove = async (productId: string) => {
        if (!isUser) {
            const localWishlistStr = localStorage.getItem('offlineWishlist');
            if (localWishlistStr) {
                try {
                    let localItems = JSON.parse(localWishlistStr);
                    localItems = localItems.filter((item: any) => item._id !== productId);
                    localStorage.setItem('offlineWishlist', JSON.stringify(localItems));
                    setWishlistItems(localItems);
                    toast.info('Removed from offline wishlist');
                    window.dispatchEvent(new Event('wishlist-updated'));
                } catch (err) {
                    console.error('Error updating local wishlist:', err);
                }
            }
            return;
        }

        try {
            const res = await userApiClient.post('/user/wishlist/toggle', { productId });
            if (res.data.success) {
                setWishlistItems(prev => prev.filter(item => item._id !== productId));
                toast.info('Removed from wishlist');
                window.dispatchEvent(new Event('wishlist-updated'));
            }
        } catch (err) {
            toast.error('Failed to remove item');
        }
    };

    const handleQuantityChange = (itemId: string, delta: number, maxStock: number) => {
        if (maxStock <= 0) return;
        setQuantities(prev => {
            const current = prev[itemId] || 1;
            const next = current + delta;
            if (next < 1) return { ...prev, [itemId]: 1 };
            if (next > maxStock) return { ...prev, [itemId]: maxStock };
            return { ...prev, [itemId]: next };
        });
    };

    const handleAddToCart = (item: any) => {
        const availableStock = item.stock !== undefined ? Math.max(0, item.stock) : 0;
        const isInactive = item.isActive === false;
        const isOutOfStock = !isInactive && availableStock <= 0;
        const isPurchasable = !isInactive && !isOutOfStock;

        if (!isPurchasable || availableStock <= 0) {
            if (isInactive) {
                toast.error('This product is currently unavailable.');
            } else {
                toast.error(`Sorry, '${item.productName}' is currently out of stock.`);
            }
            return;
        }

        const qtyToAdd = Math.min(quantities[item._id] || 1, availableStock);
        if (qtyToAdd <= 0) return;

        handleAddToCartGlobal(item, qtyToAdd, isUser, navigate, true);
    };

    return (
        <div className="page-content">
            {/* Banner Section */}
            <div className="dz-bnr-inr" style={{ backgroundImage: "url('/images/background/bg8.jpg')" }}>
                <div className="container">
                    <div className="dz-bnr-inr-entry">
                        <h1>Wish List</h1>
                        <nav aria-label="breadcrumb" className="breadcrumb-row">
                            <ul className="breadcrumb">
                                <li className="breadcrumb-item"><Link to="/">Home</Link></li>
                                <li className="breadcrumb-item active" aria-current="page">Wish List</li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </div>

            {/* Table Section */}
            <div className="content-inner-1 bg-light" style={{ padding: '80px 0' }}>
                <div className="container">
                    <div className="row justify-content-center">
                        <div className="col-lg-12">
                            {loading ? (
                                <div className="text-center p-5">
                                    <div className="spinner-border text-primary" role="status">
                                        <span className="visually-hidden">Loading...</span>
                                    </div>
                                    <p className="mt-2">Loading wishlist...</p>
                                </div>
                            ) : wishlistItems.length === 0 ? (
                                <div className="text-center p-5">
                                    <h4>Your wishlist is empty</h4>
                                    <p>Find some products you love and add them here!</p>
                                    <Link to="/shop" className="btn btn-secondary">Go to Shop</Link>
                                </div>
                            ) : (
                                <div className="table-responsive">
                                    <table className="table check-tbl style-1">
                                        <thead>
                                            <tr>
                                                <th>Image</th>
                                                <th>Product Name</th>
                                                <th>Price</th>
                                                <th>Stock Status</th>
                                                <th>Quantity</th>
                                                <th>Purchase</th>
                                                <th className="text-end">Remove</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {wishlistItems.map((item) => {
                                                const availableStock = item.stock !== undefined ? Math.max(0, item.stock) : 0;
                                                const isInactive = item.isActive === false;
                                                const isOutOfStock = !isInactive && availableStock <= 0;
                                                const isLowStock = !isInactive && !isOutOfStock && availableStock <= 10;
                                                const isPurchasable = !isInactive && !isOutOfStock;
                                                const currentQty = isPurchasable ? Math.min(quantities[item._id] || 1, availableStock) : 0;

                                                return (
                                                    <tr key={item._id}>
                                                        <td className="product-item-img">
                                                            <img src={item.images && item.images.length > 0 ? item.images[0] : '/images/shop/product/1.png'} alt={item.productName || 'Product'} />
                                                        </td>
                                                        <td className="product-item-name">
                                                            <Link to={`/product/${item._id}`} style={{ color: 'inherit', fontWeight: 600 }}>{item.productName}</Link>
                                                            <ul className="product-item-list">
                                                                {item.categoryId && <li>Category: {item.categoryId.categoryName}</li>}
                                                                {item.subcategoryId && <li>Subcategory: {item.subcategoryId.subcategoryName}</li>}
                                                                {item.sku && <li>SKU: {item.sku}</li>}
                                                            </ul>
                                                            <div style={{
                                                                fontSize: '12px',
                                                                fontWeight: 500,
                                                                marginTop: '6px',
                                                                display: 'flex',
                                                                alignItems: 'center',
                                                                gap: '5px',
                                                                color: isInactive ? '#6c757d' : isOutOfStock ? '#dc3545' : isLowStock ? '#d97706' : '#2e7d32'
                                                            }}>
                                                                <span style={{
                                                                    width: '6px',
                                                                    height: '6px',
                                                                    borderRadius: '50%',
                                                                    backgroundColor: isInactive ? '#6c757d' : isOutOfStock ? '#dc3545' : isLowStock ? '#d97706' : '#2e7d32',
                                                                    display: 'inline-block'
                                                                }}></span>
                                                                <span>{isInactive ? 'UNAVAILABLE' : isOutOfStock ? 'OUT OF STOCK' : isLowStock ? `Low Stock (${availableStock} left)` : 'IN STOCK'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="product-item-price">
                                                            ₹{item.offerPrice ? item.offerPrice.toFixed(2) : (item.price ? item.price.toFixed(2) : '0.00')}
                                                            {item.offerPrice && item.offerPrice < item.price && (
                                                                <div className="text-muted" style={{ fontSize: '0.8em', textDecoration: 'line-through' }}>₹{item.price.toFixed(2)}</div>
                                                            )}
                                                        </td>
                                                        <td className="product-item-stock" style={{ whiteSpace: 'nowrap' }}>
                                                            {isInactive ? (
                                                                <span className="badge bg-secondary text-white" style={{ padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>UNAVAILABLE</span>
                                                            ) : isOutOfStock ? (
                                                                <span className="badge bg-danger text-white" style={{ padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>OUT OF STOCK</span>
                                                            ) : isLowStock ? (
                                                                <span className="badge bg-warning text-dark" style={{ padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>LOW STOCK ({availableStock})</span>
                                                            ) : (
                                                                <span className="badge bg-success text-white" style={{ padding: '6px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.5px' }}>IN STOCK</span>
                                                            )}
                                                        </td>
                                                        <td className="product-item-quantity" style={{ verticalAlign: 'middle' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ddd', borderRadius: '4px', width: 'fit-content' }}>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleQuantityChange(item._id, -1, availableStock)}
                                                                    disabled={!isPurchasable || currentQty <= 1}
                                                                    style={{
                                                                        width: '32px',
                                                                        height: '32px',
                                                                        border: 'none',
                                                                        background: 'none',
                                                                        fontSize: '16px',
                                                                        cursor: (!isPurchasable || currentQty <= 1) ? 'not-allowed' : 'pointer',
                                                                        opacity: (!isPurchasable || currentQty <= 1) ? 0.4 : 1
                                                                    }}
                                                                >−</button>
                                                                <span style={{ width: '36px', textAlign: 'center', fontSize: '14px', fontWeight: 600 }}>
                                                                    {currentQty}
                                                                </span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleQuantityChange(item._id, 1, availableStock)}
                                                                    disabled={!isPurchasable || currentQty >= availableStock}
                                                                    style={{
                                                                        width: '32px',
                                                                        height: '32px',
                                                                        border: 'none',
                                                                        background: 'none',
                                                                        fontSize: '16px',
                                                                        cursor: (!isPurchasable || currentQty >= availableStock) ? 'not-allowed' : 'pointer',
                                                                        opacity: (!isPurchasable || currentQty >= availableStock) ? 0.4 : 1
                                                                    }}
                                                                >+</button>
                                                            </div>
                                                        </td>
                                                        <td className="product-item-totle">
                                                            <button
                                                                disabled={!isPurchasable}
                                                                onClick={() => handleAddToCart(item)}
                                                                className="btn btn-outline-secondary"
                                                                style={!isPurchasable ? {
                                                                    cursor: 'not-allowed',
                                                                    opacity: 0.5,
                                                                    borderColor: isInactive ? '#6c757d' : '#dc3545',
                                                                    color: isInactive ? '#6c757d' : '#dc3545',
                                                                    backgroundColor: isInactive ? '#f8f9fa' : '#fff5f5'
                                                                } : {}}
                                                            >
                                                                {isInactive ? 'UNAVAILABLE' : isOutOfStock ? 'OUT OF STOCK' : 'Add To Cart'}
                                                            </button>
                                                        </td>
                                                        <td className="product-item-close">
                                                            <a href="javascript:void(0);" onClick={() => handleRemove(item._id)}>
                                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
                                                                    <path d="M18 6L6 18M6 6l12 12" stroke="#DC3545" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                </svg>
                                                            </a>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Wishlist;
