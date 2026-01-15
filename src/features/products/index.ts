/**
 * Products Feature Index
 * 
 * This module follows Clean Architecture with:
 * - data/: Datasources, models, and repository implementations
 * - domain/: Repository interfaces (contracts)
 * - presentation/: Components and pages (to be migrated from modules/store)
 */

// Data layer
export * from './data';

// Domain layer
export * from './domain';

// Repository instance for easy access
export { productRepository } from './data/repositories';
