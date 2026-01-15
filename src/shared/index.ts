/**
 * Shared Module Index
 * Re-exports all shared resources
 */

// Types
export * from './types';

// Extensions (formerly utils)
export * from './extensions';

// Exceptions
export * from './exceptions';

// Services
export * from './services';

// Widgets (formerly components)
export { Modal, ToastContainer } from './widgets';

// Note: BaseLayout is located at ./layouts/BaseLayout.astro
// Import it directly in Astro files as needed
