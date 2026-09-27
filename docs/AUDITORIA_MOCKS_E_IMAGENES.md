# 🔍 Auditoría Exhaustiva de Datos Mockeados, Textos e Imágenes (FashionStore)

> **Fecha de Auditoría:** 27 de Septiembre de 2026  
> **Cuenta Cloudinary:** `dzaka0idb`  
> **Objetivo:** Revisar elemento por elemento (categorías, productos, textos e imágenes) para identificar discordancias, imágenes rotas o inadecuadas, y establecer una correspondencia 1:1 rigurosa con los activos reales de Cloudinary.

---

## 1. 📋 Resumen del Diagnóstico: ¿Por qué ocurrían los fallos?

### A. ¿Por qué la sección de productos aparecía vacía?
1. **Consulta SSR a Supabase:** En la versión inicial previa a los mocks centralizados, el servidor Node.js en SSR intentaba conectar con la URL de Supabase que había sido eliminada. Al fallar la petición de red, `supabase.from('products').select(...)` devolvía un array vacío (`data: []`), provocando el renderizado de la vista de estado vacío: *"No hay productos (0 productos)"*.
2. **Relación de Variantes (`variants:product_variants(*)`):** La consulta del catálogo requería un `JOIN` con la tabla `product_variants`. Si el mock no estructuraba las variantes dentro de cada producto o si había filtros de talla aplicados en la URL, los productos eran descartados por el filtro `filteredProducts.filter(...)`.
3. **Enlace Roto 404 en Chaquetas:** La categoría `chaquetas` apuntaba a `fashionstore/categories/chaquetas.webp`, el cual **no existe en Cloudinary (HTTP 404)**, dejando el bloque de categoría en gris o con icono de imagen rota.

### B. ¿Por qué aparecían fotos inadecuadas (hombre en camisetas, mujer en sudaderas)?
1. **Residuos del Seed Unsplash Antiguo:** En las pruebas iniciales previas a Cloudinary, se utilizaron enlaces de Unsplash:
   - `Camisetas`: Apuntaba a una foto de un modelo masculino con camiseta blanca (`photo-1521572267360-ee0c2909d518`).
   - `Sudaderas`: Apuntaba a una foto de una mujer con sudadera rosa/gris (`photo-1556905055-8f358a7a47b2`), rompiendo la coherencia de moda masculina.
   - `Camiseta Heavyweight Boxy Fit`: Apuntaba a la misma foto del modelo masculino de Unsplash.
2. **Discordancias en la carpeta `sportswear/` de Cloudinary:** Al restaurar Cloudinary, algunos productos se vincularon a activos de la subcarpeta `sportswear/` que no correspondían con el nombre del producto:
   - `Chaqueta Windrunner`: Mostraba el brazo de una mujer sosteniendo una percha con una cazadora color melocotón (`windrunner-jacket-0.webp`).
   - `Nike Air Jordan 1 High OG`: Mostraba una zapatilla de running baja Nike Free en fondo rojo (`nike-air-jordan-1-high-og-0.webp`).
   - `Adidas Samba OG`: Mostraba una zapatilla Nike Air Force 1 Carhartt marrón sobre pana amarilla (`adidas-samba-og-0.webp`).

---

## 2. 🗂️ Auditoría Elemento por Elemento: Categorías

| ID Categoría | Nombre y Slug | URL Asignada Actualmente | Estado HTTP | Contenido Visual Real de la Imagen | ¿Concuerda? | Activo Cloudinary Óptimo Recomendado |
| :--- | :--- | :--- | :---: | :--- | :---: | :--- |
| `cat-zapatillas` | **Zapatillas**<br>`zapatillas` | `.../fashionstore/categories/zapatillas.webp` | 🟢 200 | Manos atando cordones de una zapatilla negra sobre mesa de estudio. | ⚠️ Parcial | Mantener o usar `fashionstore/fashionstore/urbanstride-classic-white.webp` (zapatillas completas de estudio). |
| `cat-sudaderas` | **Sudaderas**<br>`sudaderas` | `.../fashionstore/categories/sudaderas.webp` | 🟢 200 | Modelo masculino de torso con sudadera gris con capucha en estudio fotográfico. | 🟢 Sí | `fashionstore/categories/sudaderas.webp` o `fashionstore/fashionstore/comfort-fleece-grey.webp`. |
| `cat-pantalones` | **Pantalones**<br>`pantalones` | `.../fashionstore/categories/pantalones.webp` | 🟢 200 | Piernas de hombre con pantalón deportivo negro en estudio. | 🟢 Sí | `fashionstore/categories/pantalones.webp` o `fashionstore/products/chino-pants-beige.webp`. |
| `cat-camisetas` | **Camisetas**<br>`camisetas` | `.../fashionstore/categories/camisetas.webp` | 🟢 200 | Dos pilas de camisetas dobladas (blancas y negras) sobre fondo blanco. | 🟢 Sí | `fashionstore/categories/camisetas.webp` (sin personas, muy profesional). |
| `cat-chaquetas` | **Chaquetas**<br>`chaquetas` | `.../fashionstore/categories/chaquetas.webp` | 🔴 **404** | **NO EXISTE EN CLOUDINARY** (Enlace roto). | ❌ **NO** | `fashionstore/fashionstore/techwear-pro-hoodie.webp` (Chaqueta cortavientos técnica con cremallera y capucha). |

---

## 3. 📦 Auditoría Elemento por Elemento: Productos del Catálogo

| ID Producto | Nombre del Producto | Categoría | Imagen Asignada | Estado HTTP | Inspección Visual del Activo | ¿Concuerda? | Activo Cloudinary Exacto / Solución |
| :--- | :--- | :--- | :--- | :---: | :--- | :---: | :--- |
| `prod-1` | **Chaqueta Windrunner Sportswear** | Chaquetas | `sportswear/windrunner-jacket-0.webp` | 🟢 200 | Brazo de mujer sosteniendo percha con cazadora bomber color melocotón. | ❌ **NO** (Es un brazo femenino y chaqueta casual, no deportiva masculina) | **`fashionstore/fashionstore/techwear-pro-hoodie.webp`** (Chaqueta técnica de alto rendimiento negra). |
| `prod-2` | **Sudadera Vintage Hoodie Cream** | Sudaderas | `fashionstore/products/vintage-hoodie-cream.webp` | 🟢 200 | Sudadera con capucha en tono crema/beige vintage con acabado desgastado en estudio. | 🟢 **SÍ (100%)** | **Mantener.** Coincidencia perfecta de prenda, color y textura. |
| `prod-3` | **Nike Air Jordan 1 High OG** | Zapatillas | `sportswear/nike-air-jordan-1-high-og-0.webp` | 🟢 200 | Zapatilla de running roja baja (Nike Free) sobre fondo rojo chillón. | ❌ **NO** (No es una Jordan 1 de caña alta) | **`fashionstore/fashionstore/streetstyle-high-classic.webp`** (Zapatillas clásicas de caña alta) o cambiar nombre a **`fashionstore/products/running-shoes-red.webp`** (Sneakers Running Air Max Red). |
| `prod-4` | **Pantalón Chino Beige Classic** | Pantalones | `fashionstore/products/chino-pants-beige.webp` | 🟢 200 | Pantalón chino beige corte slim con maniquí invisible (efecto 3D flotante) sobre fondo blanco. | 🟢 **SÍ (100%)** | **Mantener.** Calidad de catálogo de lujo. |
| `prod-5` | **Camiseta Graphic Tee Black** | Camisetas | `fashionstore/products/graphic-tee-black.webp` | 🟢 200 | Camiseta negra doblada con estampado geométrico frontal blanco. | 🟢 **SÍ (100%)** | **Mantener.** Coincidencia total. |
| `prod-6` | **Chaqueta Zip Hoodie Navy** | Chaquetas | `fashionstore/products/zip-hoodie-navy.webp` | 🟢 200 | Chaqueta deportiva azul marino con cremallera metálica frontal y capucha. | 🟢 **SÍ (100%)** | **Mantener.** Coincidencia total. |
| `prod-7` | **Adidas Samba OG White Black** | Zapatillas | `sportswear/adidas-samba-og-0.webp` | 🟢 200 | Zapatilla marrón de lona tipo Nike Air Force 1 Carhartt sobre tela de pana amarilla. | ❌ **NO** (No es una Adidas Samba) | **`fashionstore/fashionstore/urbanstride-classic-white.webp`** o **`fashionstore/fashionstore/cloudstep-casual-white.webp`** (Zapatillas blancas casuales de piel con puntera de ante). |
| `prod-8` | **Pantalón Slim Jeans Dark Wash** | Pantalones | `fashionstore/products/slim-jeans-dark.webp` | 🟢 200 | Vaquero azul oscuro de corte slim con maniquí invisible 3D sobre blanco. | 🟢 **SÍ (100%)** | **Mantener.** Coincidencia total. |

---

## 4. 💎 Catálogo de Activos Originales Disponibles en Cloudinary (`dzaka0idb`)

Tu cuenta de Cloudinary contiene dos colecciones de activos **con fondo blanco de estudio fotográfico profesional**, creadas específicamente para una tienda de ropa masculina:

### Colección A: `fashionstore/products/` (Estudio / Maniquí Fantasma)
1. `fashionstore/products/chino-pants-beige.webp` → Pantalón chino beige clásico.
2. `fashionstore/products/slim-jeans-dark.webp` → Vaquero denim oscuro slim.
3. `fashionstore/products/cargo-pants-olive.webp` → **Pantalón Cargo Táctico Verde Oliva** (maniquí fantasma 3D).
4. `fashionstore/products/graphic-tee-black.webp` → Camiseta gráfica negra urbana.
5. `fashionstore/products/oversized-tee-grey.webp` → **Camiseta Heavyweight Boxy Fit Gris** (la camiseta de alto gramaje que buscabas).
6. `fashionstore/products/striped-tee-navy.webp` → Camiseta náutica marinera a rayas azul y blanco.
7. `fashionstore/products/polo-shirt-navy.webp` → Polo de piqué clásico azul marino.
8. `fashionstore/products/vintage-hoodie-cream.webp` → Sudadera vintage crema con capucha.
9. `fashionstore/products/zip-hoodie-navy.webp` → Chaqueta/sudadera azul marino con cremallera.
10. `fashionstore/products/crewneck-burgundy.webp` → Sudadera cuello redondo granate/burdeos.
11. `fashionstore/products/hiking-boots-brown.webp` → Botas de montaña en cuero marrón con cordones rojos.
12. `fashionstore/products/running-shoes-red.webp` → **Sneaker Running Air Max Roja dinámica** (perfecta para el Hero flotante).
13. `fashionstore/products/skate-shoes-grey.webp` → Zapatillas skate de ante gris y suela blanca.
14. `fashionstore/products/basketball-shoes-blue.webp` → Zapatillas de baloncesto altas azul y naranja.

### Colección B: `fashionstore/fashionstore/` (Prendas y Calzado de Moda Urbana)
1. `fashionstore/fashionstore/techwear-pro-hoodie.webp` → **Chaqueta cortavientos técnica con cremallera**.
2. `fashionstore/fashionstore/comfort-fleece-grey.webp` → Sudadera clásica de felpa gris.
3. `fashionstore/fashionstore/athletic-joggers-black.webp` → Pantalón jogger deportivo negro.
4. `fashionstore/fashionstore/essential-tee-white.webp` → Camiseta básica blanca 100% algodón.
5. `fashionstore/fashionstore/cloudstep-casual-white.webp` → Zapatillas casuales todo blanco en piel.
6. `fashionstore/fashionstore/retro-court-burgundy.webp` → Zapatillas retro en ante burdeos y crema.
7. `fashionstore/fashionstore/streetstyle-high-classic.webp` → Zapatillas altas tipo lona negra streetstyle.
8. `fashionstore/fashionstore/flexmotion-training-elite.webp` → Zapatillas de entrenamiento técnico azul marino.
9. `fashionstore/fashionstore/urbanstride-runner-pro.webp` → Zapatillas running negras y verde neón.
10. `fashionstore/fashionstore/urbanstride-classic-white.webp` → Zapatillas deportivas blancas con perforaciones.

---

## 5. 🎯 Hero Section: Discordancia Detectada

- **Texto en Hero (`Hero.tsx`):**
  - Insignia: `Air Max Pulse` / `Edición Limitada`.
  - Alt text: `Nike Air Max Premium`.
- **Imagen actual en Hero:**
  - `https://res.cloudinary.com/dzaka0idb/image/upload/v1768292616/fashionstore/categories/zapatillas.webp` (Foto rectangular con manos atando cordones sobre mesa).
- **Discordancia:** Al rotarse en 3D (`rotateZ: [-2, 2, -2]`), se ve un recuadro rectangular de una foto completa en lugar de una zapatilla aislada flotando en el aire.
- **Solución Recomendada:** Asignar **`fashionstore/products/running-shoes-red.webp`** (la zapatilla Air Max roja flotante en ángulo de 45° con fondo blanco puro y sombra de contacto), que encaja exactamente con la insignia *"Air Max Pulse"*.

---

## 6. 🚀 Propuesta de Catálogo Coherente al 100%

Proponemos actualizar `embedded-store-data.ts` con **12 productos de alta gama** (3 por cada categoría principal), vinculados exclusivamente a los activos de estudio de Cloudinary donde cada prenda coincide al 100% con su descripción:

| ID | Nombre | Categoría | Imagen Cloudinary |
| :--- | :--- | :--- | :--- |
| `prod-1` | Chaqueta Técnica TechWear Pro | Chaquetas | `fashionstore/fashionstore/techwear-pro-hoodie` |
| `prod-2` | Sudadera Vintage Hoodie Cream | Sudaderas | `fashionstore/products/vintage-hoodie-cream` |
| `prod-3` | Zapatilla Retro Court Vintage Burgundy | Zapatillas | `fashionstore/fashionstore/retro-court-burgundy` |
| `prod-4` | Pantalón Chino Beige Classic | Pantalones | `fashionstore/products/chino-pants-beige` |
| `prod-5` | **Camiseta Heavyweight Boxy Fit Grey** | Camisetas | **`fashionstore/products/oversized-tee-grey`** |
| `prod-6` | Chaqueta Zip Hoodie Navy | Chaquetas | `fashionstore/products/zip-hoodie-navy` |
| `prod-7` | Zapatillas Urban CloudStep White | Zapatillas | `fashionstore/fashionstore/cloudstep-casual-white` |
| `prod-8` | Pantalón Slim Jeans Dark Wash | Pantalones | `fashionstore/products/slim-jeans-dark` |
| `prod-9` | Camiseta Graphic Tee Black Urban | Camisetas | `fashionstore/products/graphic-tee-black` |
| `prod-10` | Pantalón Cargo Táctico Olive | Pantalones | `fashionstore/products/cargo-pants-olive` |
| `prod-11` | Sudadera Crewneck Fleece Burgundy | Sudaderas | `fashionstore/products/crewneck-burgundy` |
| `prod-12` | Sneakers Air Max Runner Red | Zapatillas | `fashionstore/products/running-shoes-red` |
