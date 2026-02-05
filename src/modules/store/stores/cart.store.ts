/**
 * Cart Store
 * Shopping cart state management using Nano Stores
 * With 15-minute stock reservation system (global timer, hidden from UI)
 */

import { atom, computed } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';
import type { Cart, CartItem, Product } from '../../../shared/types';
import { STORE_CONFIG } from '../config';
import { getCartItemKey } from '../../../shared/utils';

// Session ID for stock reservations (persisted)
export const $cartSessionId = persistentAtom<string>(
    'fm_cart_session',
    '',
    {
        encode: (v) => v,
        decode: (v) => v,
    }
);

// Global cart expiration timestamp (persisted)
export const $cartExpiresAt = persistentAtom<number>(
    'fm_cart_expires',
    0,
    {
        encode: (v) => String(v),
        decode: (v) => parseInt(v) || 0,
    }
);

const RESERVATION_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Initialize session ID if not set
function getOrCreateSessionId(): string {
    let sessionId = $cartSessionId.get();
    if (!sessionId) {
        sessionId = `cart_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        $cartSessionId.set(sessionId);
    }
    return sessionId;
}

// Cart open state (for programmatic opening)
export const $isCartOpen = atom<boolean>(false);

export function openCart(): void {
    $isCartOpen.set(true);
}

export function closeCart(): void {
    $isCartOpen.set(false);
}

// Empty cart state
const EMPTY_CART: Cart = {
    items: [],
    updatedAt: Date.now(),
};

/**
 * Cart atom with localStorage persistence
 */
export const $cart = persistentAtom<Cart>(
    STORE_CONFIG.cart.storageKey,
    EMPTY_CART,
    {
        encode: JSON.stringify,
        decode: JSON.parse,
    }
);

export interface AppliedCoupon {
    code: string;
    discount_type: string;
    discount_value: number;
    discountAmount: number;
    id?: string;
    is_automatic?: boolean;
    public_title?: string;
}

/**
 * Coupon atom with persistence
 */
export const $coupon = persistentAtom<AppliedCoupon | null>(
    'fm_coupon',
    null,
    {
        encode: JSON.stringify,
        decode: JSON.parse,
    }
);

export function setCoupon(coupon: AppliedCoupon) {
    $coupon.set(coupon);
}

export function clearCoupon() {
    $coupon.set(null);
}

/**
 * Check for automatic promotions
 * DISABLED - Coupons must be applied manually by logged-in users only
 */
export async function checkAutomaticPromotions() {
    // Auto-apply disabled - coupons require manual application by authenticated users
    return;
}

/**
 * Computed: Total items count
 */
export const $cartCount = computed($cart, (cart) =>
    cart.items.reduce((sum, item) => sum + item.quantity, 0)
);

/**
 * Computed: Total price in cents
 */
export const $cartTotal = computed($cart, (cart) =>
    cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

/**
 * Computed: Is cart empty
 */
export const $isCartEmpty = computed($cart, (cart) => cart.items.length === 0);

/**
 * Reserve ALL cart items on the server (resets timer for all)
 */
async function reserveAllCartItems(): Promise<{ success: boolean; expiresAt?: number }> {
    const cart = $cart.get();
    if (cart.items.length === 0) {
        return { success: true };
    }

    const sessionId = getOrCreateSessionId();
    const expiresAt = Date.now() + RESERVATION_DURATION_MS;

    // Reserve each item with the same expiration
    try {
        for (const item of cart.items) {
            const response = await fetch('/api/stock/reserve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    productId: item.productId,
                    size: item.size,
                    quantity: item.quantity
                })
            });

            const data = await response.json();
            if (!response.ok || !data.success) {
                console.error('Failed to reserve item:', item.productId, data.error);
            }
        }

        // Update global expiration
        $cartExpiresAt.set(expiresAt);
        return { success: true, expiresAt };
    } catch (err) {
        console.error('Reserve all error:', err);
        return { success: false };
    }
}

/**
 * Release stock reservation on the server
 */
async function releaseStock(productId: string, size: string): Promise<void> {
    try {
        const sessionId = getOrCreateSessionId();
        await fetch('/api/stock/release', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId, productId, size })
        });
    } catch (err) {
        console.error('Stock release error:', err);
    }
}

/**
 * Add item to cart - reserves ALL items and resets global timer
 */
export function addToCart(
    product: Pick<Product, 'id' | 'name' | 'price' | 'images' | 'stock'> & { variants?: { size: string; stock: number }[] },
    size: string,
    quantity: number = 1
): boolean {
    const cart = $cart.get();
    const key = getCartItemKey(product.id, size);
    const existingIndex = cart.items.findIndex(
        (item) => getCartItemKey(item.productId, item.size) === key
    );

    // Check stock
    const currentQty = existingIndex >= 0 ? cart.items[existingIndex].quantity : 0;

    let availableStock = product.stock;
    if (product.variants?.length) {
        const variant = product.variants.find(v => v.size === size);
        availableStock = variant ? variant.stock : 0;
    }

    if (currentQty + quantity > availableStock) {
        return false;
    }

    // Check max quantity
    if (currentQty + quantity > STORE_CONFIG.cart.maxQuantity) {
        return false;
    }

    const newTotalQty = currentQty + quantity;

    let newItems: CartItem[];

    if (existingIndex >= 0) {
        newItems = cart.items.map((item, i) =>
            i === existingIndex
                ? { ...item, quantity: newTotalQty }
                : item
        );
    } else {
        const newItem: CartItem = {
            productId: product.id,
            productName: product.name,
            productImage: product.images[0] || '',
            price: product.price,
            size,
            quantity,
        };
        newItems = [...cart.items, newItem];
    }

    $cart.set({
        items: newItems,
        updatedAt: Date.now(),
    });

    // Reserve ALL items and reset global timer
    reserveAllCartItems();

    return true;
}

/**
 * Remove item from cart and release its reservation
 */
export function removeFromCart(productId: string, size: string): void {
    const cart = $cart.get();
    const key = getCartItemKey(productId, size);

    $cart.set({
        items: cart.items.filter(
            (item) => getCartItemKey(item.productId, item.size) !== key
        ),
        updatedAt: Date.now(),
    });

    // Release this item's reservation
    releaseStock(productId, size);

    // Revalidate coupons
    checkAutomaticPromotions();
}

/**
 * Update item quantity
 */
export function updateQuantity(
    productId: string,
    size: string,
    quantity: number
): void {
    if (quantity < 1) {
        removeFromCart(productId, size);
        return;
    }

    const cart = $cart.get();
    const key = getCartItemKey(productId, size);

    $cart.set({
        items: cart.items.map((item) =>
            getCartItemKey(item.productId, item.size) === key
                ? { ...item, quantity: Math.min(quantity, STORE_CONFIG.cart.maxQuantity) }
                : item
        ),
        updatedAt: Date.now(),
    });

    // Update reservation for this item
    const sessionId = getOrCreateSessionId();
    fetch('/api/stock/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, productId, size, quantity })
    }).catch(err => console.error('Update quantity reserve error:', err));
}

/**
 * Clear entire cart and release all reservations
 */
export function clearCart(): void {
    const cart = $cart.get();

    // Release all reservations
    cart.items.forEach(item => {
        releaseStock(item.productId, item.size);
    });

    $cart.set(EMPTY_CART);
    $cartExpiresAt.set(0);
}

/**
 * Release all reservations for current session (after checkout)
 */
export async function releaseAllReservations(): Promise<void> {
    try {
        const sessionId = getOrCreateSessionId();
        await fetch('/api/stock/release-all', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionId })
        });
        $cartExpiresAt.set(0);
    } catch (err) {
        console.error('Release all reservations error:', err);
    }
}

/**
 * Get cart session ID for checkout
 */
export function getCartSessionId(): string {
    return getOrCreateSessionId();
}

/**
 * Check if cart has expired and clear it if so
 */
export function checkCartExpiration(): boolean {
    const expiresAt = $cartExpiresAt.get();
    const cart = $cart.get();

    if (expiresAt > 0 && Date.now() > expiresAt && cart.items.length > 0) {
        // Cart has expired - clear it
        clearCart();
        clearCoupon();
        return true; // Expired
    }
    return false; // Not expired
}

/**
 * Get specific cart item
 */
export function getCartItem(
    productId: string,
    size: string
): CartItem | undefined {
    const cart = $cart.get();
    const key = getCartItemKey(productId, size);
    return cart.items.find(
        (item) => getCartItemKey(item.productId, item.size) === key
    );
}
