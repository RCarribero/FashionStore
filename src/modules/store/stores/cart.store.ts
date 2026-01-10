/**
 * Cart Store
 * Shopping cart state management using Nano Stores
 */

import { atom, computed } from 'nanostores';
import { persistentAtom } from '@nanostores/persistent';
import type { Cart, CartItem, Product } from '../../../shared/types';
import { STORE_CONFIG } from '../config';
import { getCartItemKey } from '../../../shared/utils';

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
 * Add item to cart
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

    let newItems: CartItem[];

    if (existingIndex >= 0) {
        // Update existing item
        newItems = cart.items.map((item, i) =>
            i === existingIndex
                ? { ...item, quantity: item.quantity + quantity }
                : item
        );
    } else {
        // Add new item
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

    return true;
}

/**
 * Remove item from cart
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
}

/**
 * Clear entire cart
 */
export function clearCart(): void {
    $cart.set(EMPTY_CART);
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
