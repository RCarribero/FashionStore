/**
 * Admin Module Index
 * Re-exports all admin module exports
 */

// Configuration
export { ADMIN_CONFIG } from './config';

// Services
export * from './services/product.service';
export * from './services/category.service';
export * from './services/dashboard.service';

// Components
export { default as ImageUploader } from './components/ImageUploader';
