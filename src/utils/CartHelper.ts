import { toast } from 'react-toastify';
import userApiClient from '../services/userApiClient';
import { API_ENDPOINTS } from '../constants/apiEndpoints';

// Interface matching the Product interface defined in Shop/ProductDetails
export interface Product {
    _id: string;
    productName: string;
    sku: string;
    price: number;
    images: string[];
    stock?: number;
    isActive?: boolean;
    featured?: boolean;
    isPopular?: boolean;
    isTrending?: boolean;
    isBestSeller?: boolean;
    specifications?: Record<string, string>;
    categoryId?: { _id: string; categoryName: string };
    subcategoryId?: { _id: string; subcategoryName: string };
}

/**
 * Universal helper method for adding items to the cart.
 * Automatically handles whether the user is authenticated (using API) or unauthenticated (using localStorage).
 * It expects a valid boolean `isUser` (e.g. from Redux auth slice).
 * 
 * @param {Product} prod The actual product object
 * @param {number} quantity The number of items to add
 * @param {boolean} isUser Authentication state from Redux
 * @param {function} navigate React Router navigation function
 * @param {boolean} redirect True if the user should be redirected to the cart after adding
 */
export const handleAddToCartGlobal = async (
    prod: Product,
    quantity: number,
    isUser: boolean,
    navigate: (path: string) => void,
    redirect: boolean = false
) => {
    if (prod.isActive === false) {
        toast.error('This product is currently inactive and cannot be purchased.');
        return;
    }

    if (prod.stock !== undefined && prod.stock <= 0) {
        toast.error(`Sorry, '${prod.productName}' is currently out of stock.`);
        return;
    }

    if (isUser) {
        try {
            const res = await userApiClient.post(API_ENDPOINTS.USER.CART.TOGGLE, { productId: prod._id, quantity });
            if (res.data.success) {
                toast.success('Added to cart');
                // Dispatch custom event to update sidebar icon even when logged in
                window.dispatchEvent(new Event('cart-updated'));
            }
        } catch (err: any) {
            const errMsg = err.response?.data?.message || 'Failed to update cart';
            toast.error(errMsg);
            return;
        }
    } else {
        // Offline logic
        const localCartStr = localStorage.getItem('offlineCart');
        let offlineItems: any[] = [];
        if (localCartStr) {
            try {
                offlineItems = JSON.parse(localCartStr);
            } catch (err) {
                offlineItems = [];
            }
        }

        const existsIndex = offlineItems.findIndex(p => p.product._id === prod._id);
        const currentQty = existsIndex > -1 ? offlineItems[existsIndex].quantity : 0;
        const newTotalQty = currentQty + quantity;

        if (prod.stock !== undefined && newTotalQty > prod.stock) {
            toast.error(`Only ${prod.stock} units of '${prod.productName}' are available in stock.`);
            return;
        }

        if (existsIndex > -1) {
            offlineItems[existsIndex].quantity = newTotalQty;
            toast.success('Cart updated');
        } else {
            offlineItems.push({ product: prod, quantity });
            toast.success('Added to offline cart. Login to save permanently.');
        }
        localStorage.setItem('offlineCart', JSON.stringify(offlineItems));
        // Dispatch custom event to update sidebar icon
        window.dispatchEvent(new Event('cart-updated'));
    }

    if (redirect) {
        navigate('/shop-cart');
    }
};

/**
 * Universal helper method for toggling items in the wishlist.
 */
export const handleToggleWishlistGlobal = async (
    prod: Product,
    isUser: boolean,
    navigate: (path: string) => void,
    redirect: boolean = false
) => {
    if (isUser) {
        try {
            const res = await userApiClient.post(API_ENDPOINTS.USER.WISHLIST.TOGGLE, { productId: prod._id });
            if (res.data.success) {
                if (res.data.action === 'added') {
                    toast.success('Added to wishlist');
                } else {
                    toast.info('Removed from wishlist');
                }
                window.dispatchEvent(new Event('wishlist-updated'));
            }
        } catch (err: any) {
            toast.error('Failed to update wishlist');
            return;
        }
    } else {
        // Offline logic
        const localWishlistStr = localStorage.getItem('offlineWishlist');
        let offlineItems: Product[] = [];
        if (localWishlistStr) {
            try {
                offlineItems = JSON.parse(localWishlistStr);
            } catch (err) { }
        }

        const exists = offlineItems.find(p => p._id === prod._id);
        if (exists) {
            offlineItems = offlineItems.filter(p => p._id !== prod._id);
            toast.info('Removed from offline wishlist');
        } else {
            offlineItems.push(prod);
            toast.success('Added to offline wishlist');
        }
        localStorage.setItem('offlineWishlist', JSON.stringify(offlineItems));
        window.dispatchEvent(new Event('wishlist-updated'));
    }

    if (redirect) {
        navigate('/wishlist');
    }
};
