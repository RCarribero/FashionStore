/**
 * Script para preoptimizar imágenes en Cloudinary
 * Aplica transformaciones de compresión, formato auto y redimensionamiento
 * Genera un archivo de mapeo de URLs optimizadas
 */

import { v2 as cloudinary } from 'cloudinary';
import * as fs from 'fs';
import * as path from 'path';
import * as https from 'https';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CloudinaryResource {
    public_id: string;
    type: string;
    format: string;
    resource_type: string;
    bytes: number;
    url: string;
}

interface OptimizedImage {
    original_public_id: string;
    original_url: string;
    original_size: number;
    optimized_url: string;
    optimized_size?: number;
    resource_type: 'category' | 'product' | 'logo' | 'other';
    width?: number;
    height?: number;
}

const CATEGORY_WIDTH = 1024;
const CATEGORY_HEIGHT = 800;
const PRODUCT_WIDTH = 700;
const PRODUCT_HEIGHT = 800;

function detectResourceType(publicId: string): OptimizedImage['resource_type'] {
    if (publicId.includes('categories/')) return 'category';
    if (publicId.includes('products/')) return 'product';
    if (publicId.includes('logo') || publicId.includes('stripe')) return 'logo';
    return 'other';
}

function buildOptimizedUrl(publicId: string, resourceType: OptimizedImage['resource_type']): string {
    const baseUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`;
    
    // Transformaciones base para todas: auto format, quality auto:eco
    const transformations = [
        {
            f_auto: 'auto',
            q_auto: 'eco',
            fl: 'lossy' // Enable lossy optimization
        }
    ];

    // Transformaciones específicas por tipo
    if (resourceType === 'category') {
        transformations.push({
            w: CATEGORY_WIDTH,
            h: CATEGORY_HEIGHT,
            c: 'fill',
            g: 'auto'
        });
    } else if (resourceType === 'product') {
        transformations.push({
            w: PRODUCT_WIDTH,
            h: PRODUCT_HEIGHT,
            c: 'fill',
            g: 'auto'
        });
    } else if (resourceType === 'logo') {
        transformations.push({
            w: 200,
            h: 100,
            c: 'fit'
        });
    }

    // Construir string de transformaciones
    const transformString = transformations.map(t => {
        return Object.entries(t)
            .map(([k, v]) => `${k}_${v}`)
            .join(',');
    }).join('/');

    return `${baseUrl}/${transformString}/${publicId}.auto`;
}

async function fetchResourceSize(url: string): Promise<number | undefined> {
    return new Promise((resolve) => {
        try {
            https.head(url, { timeout: 5000 }, (res) => {
                const size = res.headers['content-length'];
                resolve(size ? parseInt(size, 10) : undefined);
            }).on('error', () => {
                resolve(undefined);
            });
        } catch {
            resolve(undefined);
        }
    });
}

async function optimizeCloudinaryImages(): Promise<void> {
    console.log('🚀 Starting Cloudinary image optimization...\n');

    try {
        // Fetch all resources from Cloudinary
        console.log('📥 Fetching resources from Cloudinary...');
        const resources = await cloudinary.api.resources({
            max_results: 500,
            resource_type: 'image'
        }) as { resources: CloudinaryResource[] };

        console.log(`   Found ${resources.resources.length} images\n`);

        const optimizedImages: OptimizedImage[] = [];
        let totalOriginalSize = 0;
        let totalOptimizedSize = 0;

        // Process each resource
        for (let i = 0; i < resources.resources.length; i++) {
            const resource = resources.resources[i];
            const resourceType = detectResourceType(resource.public_id);
            const optimizedUrl = buildOptimizedUrl(resource.public_id, resourceType);

            process.stdout.write(`\r⏳ Processing ${i + 1}/${resources.resources.length}...`);

            // Try to fetch optimized size (with timeout)
            const optimizedSize = await fetchResourceSize(optimizedUrl);

            const optimized: OptimizedImage = {
                original_public_id: resource.public_id,
                original_url: resource.url,
                original_size: resource.bytes,
                optimized_url: optimizedUrl,
                optimized_size: optimizedSize,
                resource_type: resourceType,
                width: resourceType === 'category' ? CATEGORY_WIDTH : resourceType === 'product' ? PRODUCT_WIDTH : undefined,
                height: resourceType === 'category' ? CATEGORY_HEIGHT : resourceType === 'product' ? PRODUCT_HEIGHT : undefined,
            };

            optimizedImages.push(optimized);
            totalOriginalSize += resource.bytes;
            if (optimizedSize) {
                totalOptimizedSize += optimizedSize;
            }
        }

        console.log('\n');

        // Generate report
        const report = {
            generated_at: new Date().toISOString(),
            total_images: optimizedImages.length,
            total_original_size_kb: Math.round(totalOriginalSize / 1024),
            total_optimized_size_kb: Math.round(totalOptimizedSize / 1024),
            estimated_savings_kb: Math.round((totalOriginalSize - totalOptimizedSize) / 1024),
            estimated_savings_percent: totalOriginalSize > 0 ? Math.round(((totalOriginalSize - totalOptimizedSize) / totalOriginalSize) * 100) : 0,
            images: optimizedImages
        };

        // Save to file
        const outputDir = path.join(process.cwd(), 'cloudinary-optimized-urls.json');
        fs.writeFileSync(outputDir, JSON.stringify(report, null, 2));

        console.log('✅ Optimization complete!\n');
        console.log(`📊 Report:`);
        console.log(`   Total images: ${report.total_images}`);
        console.log(`   Original size: ${report.total_original_size_kb} KB`);
        console.log(`   Optimized size: ${report.total_optimized_size_kb} KB`);
        console.log(`   Estimated savings: ${report.estimated_savings_kb} KB (${report.estimated_savings_percent}%)\n`);
        console.log(`📄 Full report saved to: cloudinary-optimized-urls.json`);
        console.log(`\n💡 Next steps:`);
        console.log(`   1. Review the optimized URLs in cloudinary-optimized-urls.json`);
        console.log(`   2. Update CategoriesGrid.astro to use optimized URLs`);
        console.log(`   3. Update ProductCard.astro to use optimized URLs`);
        console.log(`   4. Deploy and monitor Core Web Vitals improvement\n`);

        // Also generate a helper file with utility functions
        const helperCode = `
/**
 * Auto-generated Cloudinary URL builder
 * Usage: buildCloudinaryUrl('fashionstore/categories/zapatillas', 'category')
 */

export type ResourceType = 'category' | 'product' | 'logo' | 'other';

const CLOUDINARY_CLOUD = '${process.env.CLOUDINARY_CLOUD_NAME}';
const CATEGORY_WIDTH = ${CATEGORY_WIDTH};
const CATEGORY_HEIGHT = ${CATEGORY_HEIGHT};
const PRODUCT_WIDTH = ${PRODUCT_WIDTH};
const PRODUCT_HEIGHT = ${PRODUCT_HEIGHT};

export function buildCloudinaryUrl(
  publicId: string,
  resourceType: ResourceType = 'other',
  options?: {
    width?: number;
    height?: number;
    quality?: 'auto:eco' | 'auto:good' | 'auto:best';
    format?: 'auto' | 'webp' | 'avif' | 'jpg';
  }
): string {
  const baseUrl = \`https://res.cloudinary.com/\${CLOUDINARY_CLOUD}/image/upload\`;

  const quality = options?.quality || 'auto:eco';
  const format = options?.format || 'auto';

  const transformations: Record<string, string | number>[] = [
    {
      f_auto: format,
      q_auto: quality,
      fl: 'lossy'
    }
  ];

  // Determine dimensions based on resource type
  let width = options?.width;
  let height = options?.height;
  let crop = 'fill';

  if (!width && !height) {
    if (resourceType === 'category') {
      width = CATEGORY_WIDTH;
      height = CATEGORY_HEIGHT;
    } else if (resourceType === 'product') {
      width = PRODUCT_WIDTH;
      height = PRODUCT_HEIGHT;
    }
  }

  if (width || height) {
    transformations.push({
      w: width || 'auto',
      h: height || 'auto',
      c: crop,
      g: 'auto'
    });
  }

  const transformString = transformations
    .map(t => Object.entries(t).map(([k, v]) => \`\${k}_\${v}\`).join(','))
    .join('/');

  return \`\${baseUrl}/\${transformString}/\${publicId}.auto\`;
}

/**
 * Generate responsive srcset for image optimization
 */
export function buildResponsiveSet(
  publicId: string,
  resourceType: ResourceType = 'product'
): string {
  const baseUrl = \`https://res.cloudinary.com/\${CLOUDINARY_CLOUD}/image/upload\`;
  const baseTransforms = 'f_auto,q_auto:eco,fl_lossy';

  if (resourceType === 'product') {
    return [
      \`\${baseUrl}/w_400,\${baseTransforms}/\${publicId}.auto 400w\`,
      \`\${baseUrl}/w_700,\${baseTransforms}/\${publicId}.auto 700w\`,
      \`\${baseUrl}/w_1024,\${baseTransforms}/\${publicId}.auto 1024w\`,
    ].join(',');
  }

  return \`\${baseUrl}/w_1024,\${baseTransforms}/\${publicId}.auto 1024w\`;
}
`;

        const helperPath = path.join(process.cwd(), 'src/lib/services/cloudinary-url.ts');
        fs.mkdirSync(path.dirname(helperPath), { recursive: true });
        fs.writeFileSync(helperPath, helperCode);
        console.log(`✨ Utility functions created at: src/lib/services/cloudinary-url.ts\n`);

    } catch (error) {
        console.error('❌ Error during optimization:', error);
        process.exit(1);
    }
}

// Run the optimization
optimizeCloudinaryImages();
