/**
 * Features Module Index
 * 
 * Each feature follows Clean Architecture:
 * - data/: Datasources, models, repository implementations
 * - domain/: Repository interfaces (contracts)
 * - presentation/: Components and pages
 * 
 * Current features:
 * - products: Product catalog and management
 * 
 * Planned features to migrate from modules/:
 * - authentication: Login, register, session management
 * - cart: Shopping cart functionality
 * - checkout: Payment flow
 * - orders: Order management
 * - admin: Admin panel functionality
 */

export * from './products';
