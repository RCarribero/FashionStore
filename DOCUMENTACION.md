# Documentación Completa - FashionStore / FashionMarket

## Visión General del Proyecto

**FashionStore** (también conocido como **FashionMarket**) es una plataforma de e-commerce completa especializada en moda masculina premium. El proyecto está desarrollado con Astro, React, TailwindCSS y utiliza Supabase como backend para autenticación y base de datos.

**Características principales:**
- Tienda online con catálogo de productos
- Sistema de categorías dinámico
- Carrito de compras con gestión de variantes
- Sistema de cupones y promociones
- Panel de administración completo
- Blog/Editorial integrado
- Autenticación de usuarios
- Integración con Stripe para pagos
- Optimización de imágenes con Cloudinary

---

## Stack Tecnológico

### Frontend
- **Framework:** Astro v5.16.7 (SSR mode)
- **UI Library:** React v19.2.3
- **Styling:** TailwindCSS v3.4.16
- **Animaciones:** Framer Motion v12.26.2

### Backend & Servicios
- **Base de Datos:** Supabase (PostgreSQL)
- **Autenticación:** Supabase Auth
- **Pagos:** Stripe v20.1.2
- **Imágenes:** Cloudinary v2.8.0
- **Email:** Nodemailer v7.0.12

### Gestión de Estado
- **Nanostores:** v1.1.0 (estado global del carrito)
- **Drag & Drop:** @dnd-kit (para reordenar elementos en admin)

---

## Arquitectura del Proyecto

```
src/
├── config/          # Configuración centralizada (rutas, constantes)
├── modules/         # Módulos principales de la aplicación
│   ├── admin/       # Panel de administración
│   ├── auth/        # Sistema de autenticación
│   ├── store/       # Tienda pública
│   └── checkout/    # Proceso de compra
├── pages/           # Rutas de Astro
├── shared/          # Componentes y utilidades compartidas
└── lib/             # Librerías y servicios externos
```

---

## Estructura de Navegación

### Rutas Públicas

| Ruta | Descripción |
|------|-------------|
| `/` | Página principal (Homepage) |
| `/productos` | Catálogo general |
| `/productos/[slug]` | Detalle de producto |
| `/categoria/[slug]` | Productos por categoría |
| `/tienda/ofertas` | Productos en oferta |
| `/tienda/outlet` | Sección outlet |
| `/checkout` | Proceso de compra |
| `/checkout/success` | Confirmación de pedido |
| `/editorial` | Listado de artículos |
| `/editorial/[slug]` | Detalle de artículo |

### Rutas de Autenticación

| Ruta | Descripción |
|------|-------------|
| `/auth/login` | Inicio de sesión |
| `/auth/registro` | Registro de usuario |
| `/auth/recuperar-password` | Recuperación de contraseña |
| `/auth/cambiar-password` | Cambio de contraseña |

### Rutas de Usuario

| Ruta | Descripción |
|------|-------------|
| `/cuenta/perfil` | Perfil del usuario |
| `/cuenta/success` | Confirmación de acciones |
| `/pedidos` | Historial de pedidos |

### Rutas de Administración

| Ruta | Descripción |
|------|-------------|
| `/gestion-fm` | Dashboard principal |
| `/gestion-fm/productos` | Listado de productos |
| `/gestion-fm/productos/nuevo` | Crear producto |
| `/gestion-fm/productos/[id]` | Editar producto |
| `/gestion-fm/categorias` | Gestión de categorías |
| `/gestion-fm/pedidos` | Gestión de pedidos |
| `/gestion-fm/pedidos/[id]` | Detalle de pedido |
| `/gestion-fm/cupones` | Gestión de cupones |
| `/gestion-fm/promociones` | Gestión de promociones |
| `/gestion-fm/usuarios` | Gestión de usuarios |
| `/gestion-fm/editorial` | Gestión de artículos |
| `/gestion-fm/editorial/nuevo` | Crear artículo |
| `/gestion-fm/editorial/[id]` | Editar artículo |
| `/gestion-fm/diseno` | Diseño de la homepage |

### Páginas Legales e Información

| Ruta | Descripción |
|------|-------------|
| `/legal/terminos` | Términos y condiciones |
| `/legal/privacidad` | Política de privacidad |
| `/legal/cookies` | Política de cookies |
| `/legal/devoluciones` | Política de devoluciones |
| `/info/contacto` | Página de contacto |
| `/info/envio` | Información de envío |

---

## Descripción Detallada de Vistas

## 1. ÁREA PÚBLICA (Tienda)

### 1.1 Homepage (`/`)

**Descripción:** Página principal de la tienda con layout dinámico configurable desde el panel de administración.

**Secciones disponibles:**
- **Hero Section:** Banner principal con imagen destacada
- **Offer Banner:** Banner de ofertas especiales
- **Categories Grid:** Grid de categorías principales
- **Featured Products:** Productos destacados
- **Value Props:** Propuestas de valor (envío gratis, devoluciones, etc.)
- **Custom Text Section:** Secciones de texto personalizables

**Características:**
- Las secciones se cargan dinámicamente desde la base de datos (`home_sections`)
- El orden y visibilidad de cada sección es configurable
- Layout responsive optimizado para móvil y desktop
- Integración con Cloudinary para optimización de imágenes

**Navegación:**
- Header con logo y menú de categorías
- Carrito de compras visible en esquina superior
- Footer con enlaces a páginas legales y redes sociales


### 1.2 Catálogo de Productos (`/productos`)

**Descripción:** Vista principal del catálogo con todos los productos disponibles. Diseño inspirado en tiendas premium como Nike, JD Sports y Adidas.

**Características principales:**
- **Grid de productos:** Layout en cuadrícula (2 columnas en móvil, 3 en desktop)
- **Sistema de filtros:**
  - Filtro por categorías (sidebar)
  - Rango de precios (mínimo/máximo)
  - Tallas disponibles (XS, S, M, L, XL, XXL)
- **Información de producto:**
  - Imagen principal optimizada con Cloudinary
  - Nombre del producto
  - Precio actual
  - Precio con descuento (si aplica promoción)
  - Badge de promoción activa
  - Indicador de stock agotado
- **Hover effects:** Overlay con botón "Ver Producto" al pasar el mouse
- **Contador de resultados:** Muestra cantidad de productos filtrados

**Funcionalidades:**
- Aplicación de filtros mediante formulario GET
- Opción de limpiar todos los filtros activos
- Sistema de descuentos automático integrado con promociones
- Vista de estado vacío cuando no hay productos


### 1.3 Página de Categoría (`/categoria/[slug]`)

**Descripción:** Vista filtrada de productos pertenecientes a una categoría específica. Similar al catálogo pero pre-filtrada.

**Características:**
- **Hero section** con nombre y descripción de la categoría
- **Breadcrumb navigation:** Inicio > Productos > [Categoría]
- **Mismos filtros** que el catálogo general (precio, tallas)
- **Lista de categorías** en sidebar (con categoría activa destacada)
- **Grid de productos** con información completa
- **Badges especiales:**
  - Descuentos (ejemplo: -15%)
  - Stock agotado
  - Etiqueta de categoría en cada producto

**Diferencias con catálogo general:**
- Pre-filtrado por categoría específica
- Muestra descripción de la categoría en el header
- Breadcrumbs contextuales


### 1.4 Detalle de Producto (`/productos/[slug]`)

**Descripción:** Vista completa de un producto individual con toda su información, galería de imágenes y opciones de compra.

**Layout principal:**
```
┌─────────────────┬──────────────────┐
│   Galería de    │   Información    │
│   Imágenes      │   del Producto   │
│   (Grid 4x5)    │   + Compra       │
└─────────────────┴──────────────────┘
         Productos Relacionados
```

**Sección de Imágenes:**
- **Imagen principal:** Aspect ratio 4:5, hover zoom
- **Galería de miniaturas:** Grid 4 columnas
- **Icono de zoom** en esquina inferior derecha
- **Badge "Nuevo"** en esquina superior izquierda
- Selección de imagen activa mediante click en miniaturas

**Información del Producto:**
- Breadcrumb navigation completo
- Nombre de categoría (enlazado)
- Título del producto (grande, bold, uppercase)
- **Pricing:**
  - Precio actual destacado
  - Precio tachado (precio original)
  - Badge de descuento (ejemplo: -20%)
- Descripción detallada
- **Componente de Add to Cart:**
  - Selector de talla (si tiene variantes)
  - Selector de cantidad
  - Indicador de stock disponible
  - Botón "Añadir al Carrito"
- **Features del producto:**
  - Envío gratis en pedidos +100 EUR
  - Devoluciones 30 días
  - Pago seguro con Stripe
- **Accordion de detalles:**
  - Categoría
  - SKU
  - Disponibilidad

**Productos Relacionados:**
- Sección inferior con 4 productos de la misma categoría
- Grid responsive (2 columnas móvil, 4 desktop)
- Link para ver más productos de la categoría


### 1.5 Ofertas (`/tienda/ofertas`)

**Descripción:** Página dedicada a productos en promoción activa.

**Características:**
- Filtrado automático de productos con descuento
- Muestra porcentaje de descuento en cada producto
- Timer de cuenta regresiva para ofertas temporales
- Ordenamiento por descuento o precio final


### 1.6 Outlet (`/tienda/outlet`)

**Descripción:** Sección especial con productos de temporadas anteriores o stock limitado.

**Características:**
- Descuentos más agresivos
- Indicador de "última unidad" cuando stock es 1
- Productos no retornables (aviso especial)
- Grid similar al catálogo general


### 1.7 Búsqueda (`/tienda/buscar`)

**Descripción:** Página de resultados de búsqueda.

**Características:**
- Búsqueda por nombre de producto
- Búsqueda por SKU
- Sugerencias mientras se escribe
- Filtros aplicables a resultados


---

## 2. PROCESO DE COMPRA

### 2.1 Checkout (`/checkout`)

**Descripción:** Página de finalización de compra con formulario de datos y resumen del pedido.

**Layout:**
```
┌────────────────────┬──────────────┐
│  Formulario de     │   Resumen    │
│  Datos (2 cols)    │  del Pedido  │
│                    │  (1 col)     │
└────────────────────┴──────────────┘
```

**Formulario de Datos:**
- **Información personal:**
  - Nombre completo
  - Email
  - Teléfono
- **Dirección de envío:**
  - Calle y número
  - Ciudad
  - Código postal
  - País
- **Método de pago:** Integración con Stripe
- Validación de campos en tiempo real
- Botón "Finalizar Compra"

**Resumen del Pedido:**
- Lista de productos en el carrito
- Imagen miniatura de cada producto
- Talla y cantidad seleccionada
- Subtotal
- Descuentos aplicados (cupones)
- Costos de envío
- **Total final destacado**
- Enlace para "Volver a la tienda"
- Aviso de "Pagos seguros procesados por Stripe"

**ComponentesReact:**
- `CheckoutForm`: Formulario principal
- `OrderSummary`: Resumen del pedido
- Validación de datos antes de proceder al pago


### 2.2 Success (`/checkout/success`)

**Descripción:** Página de confirmación después de completar una compra exitosa.

**Características:**
- Mensaje de agradecimiento
- Número de pedido
- Resumen de la compra realizada
- Email de confirmación enviado
- Botón para descargar factura (PDF)
- Enlace para "Seguir comprando"
- Tiempo estimado de entrega

---

## 3. AUTENTICACIÓN

### 3.1 Login (`/auth/login`)

**Descripción:** Página de inicio de sesión para el panel de administración.

**Diseño:**
- Logo de FashionMarket centrado
- Título "Panel de Administración"
- Formulario minimalista con:
  - Campo de email
  - Campo de contraseña
  - Botón "Acceder"
- Link para "Volver a la tienda"
- Manejo de errores inline
- Diseño en tonos navy y crema (elegante)

**Flujo:**
1. Usuario ingresa credenciales
2. Validación con Supabase Auth
3. Si es correcto: redirección a dashboard
4. Si es incorrecto: muestra error


### 3.2 Registro (`/auth/registro`)

**Descripción:** Formulario de registro para nuevos usuarios.

**Campos:**
- Nombre completo
- Email
- Contraseña (con requisitos mínimos)
- Confirmación de contraseña
- Checkbox de términos y condiciones


### 3.3 Recuperar Contraseña (`/auth/recuperar-password`)

**Descripción:**  Página para solicitar restablecimiento de contraseña.

**Flujo:**
1. Usuario ingresa su email
2. Sistema envía correo con enlace de recuperación
3. Enlace redirige a `/auth/cambiar-password` con token


### 3.4 Cambiar Contraseña (`/auth/cambiar-password`)

**Descripción:** Formulario para establecer nueva contraseña.

**Campos:**
- Nueva contraseña
- Confirmar nueva contraseña
- Validación de fortaleza de contraseña

---

## 4. ÁREA DE USUARIO

### 4.1 Perfil (`/cuenta/perfil`)

**Descripción:** Página de gestión de perfil del usuario autenticado.

**Secciones:**
- Información personal (nombre, email, teléfono)
- Dirección de envío predeterminada
- Cambiar contraseña
- Preferencias de comunicación


### 4.2 Pedidos (`/pedidos`)

**Descripción:** Historial de pedidos del usuario.

**Información mostrada:**
- Número de pedido
- Fecha de compra
- Estado del pedido (Procesando, Enviado, Entregado)
- Total pagado
- Botón para ver detalle
- Opción de descargar factura

---

## 5. PANEL DE ADMINISTRACIÓN

### 5.1 Dashboard (`/gestion-fm`)

**Descripción:** Panel principal del administrador con estadísticas y accesos rápidos.

**Estadísticas (Cards superiores):**
1. **Total Productos**
   - Icono: caja
   - Contador total de productos
   - Color: azul navy

2. **Unidades en Stock**
   - Icono: inventario
   - Suma total del stock
   - Color: verde

3. **Valor Inventario**
   - Icono: moneda
   - Valor total calculado (precio × stock)
   - Color: dorado

4. **Stock Bajo / Agotado**
   - Icono: alerta
   - Contador de productos con stock < 5 / stock = 0
   - Color: rojo

**Acciones Rápidas:**
- Botón "+ Nuevo Producto"
- Botón "Ver Productos"
- Botón "Gestionar Categorías"

**Sección Principal (2 columnas):**

**Columna Izquierda (2/3):**
- **Productos Recientes:**
  - Lista de últimos 5-10 productos creados
  - Miniatura, nombre, categoría, precio, stock
  - Link directo a edición

**Columna Derecha (1/3):**
- **Productos por Categoría:**
  - Gráfico de barras/lista
  - Porcentaje de distribución
  - Cantidad por categoría

- **Resumen Rápido:**
  - Total de categorías
  - Productos destacados
  - Productos agotados (resaltado en rojo si > 0)


### 5.2 Gestión de Productos (`/gestion-fm/productos`)

**Descripción:** Listado completo de productos con tabla administrativa.

**Tabla de Productos:**

| Columna | Información |
|---------|-------------|
| Producto | Miniatura + Nombre + Badge "Destacado" |
| Categoría | Nombre de categoría o "Sin categoría" |
| Precio | Formato EUR con formatPrice() |
| Stock | Badge colorizado (Verde: >5, Amarillo: 1-4, Rojo: 0) |
| Acciones | Editar / Eliminar |

**Funcionalidades:**
- Búsqueda de productos
- Filtrado por categoría
- Ordenamiento por columnas
- Vista vacía con CTA "Crear Producto"
- **Botón "Nuevo Producto"** en header

**Al eliminar:**
- Confirmación modal
- Llamada DELETE a `/api/products/{id}`
- Recarga de página tras success


### 5.3 Crear/Editar Producto (`/gestion-fm/productos/nuevo` o `/[id]`)

**Descripción:** Formulario completo para crear o editar productos.

**Campos del formulario:**

**Información Básica:**
- Nombre del producto *
- Slug (auto-generado si se deja vacío)
- Descripción larga (textarea)
- Categoría (dropdown) *
- Precio (en EUR) *
- Stock total *
- Checkbox "Destacado"

**Imágenes:**
- Upload múltiple de imágenes
- Drag & drop para reordenar
- Integración con Cloudinary
- Preview de imágenes cargadas
- Botón eliminar por imagen

**Variantes (Tallas):**
- Tabla de variantes:
  - Talla (XS, S, M, L, XL, XXL)
  - Stock por talla
  - SKU específico (opcional)
- Botón "+ Añadir Variante"
- Botón eliminar variante

**SEO (opcional):**
- Meta título
- Meta descripción

**Botones de acción:**
- "Guardar" (POST o PUT a API)
- "Cancelar" (volver a listado)


### 5.4 Gestión de Categorías (`/gestion-fm/categorias`)

**Descripción:** CRUD completo de categorías de productos.

**Vista:**
- Tabla con: Nombre, Slug, Imagen, Cantidad de productos
- Botón "+ Nueva Categoría"
- Acciones: Editar / Eliminar
- Sistema de drag & drop para reordenar

**Modal de crear/editar:**
- Nombre *
- Slug (auto-generado)
- Descripción
- Imagen de categoría
- Orden/posición


### 5.5 Gestión de Pedidos (`/gestion-fm/pedidos`)

**Descripción:** Dashboard de pedidos realizados en la tienda.

**Estado actual:** 
> Placeholder con mensaje "Esta sección estará disponible después de integrar Stripe para procesar pagos"

**Próximos pasos indicados:**
- Integrar Stripe Checkout
- Crear tabla de pedidos en Supabase
- Configurar webhooks de pago

**Funcionalidades previstas:**
- Listado de pedidos con filtros por estado
- Vista detallada de cada pedido
- Cambio de estados (Procesando, Enviado, Entregado)
- Generación de etiquetas de envío
- Notificaciones de email automatizadas


### 5.6 Detalle de Pedido (`/gestion-fm/pedidos/[id]`)

**Funcionalidades previstas:**
- Información del cliente
- Productos del pedido
- Dirección de envío
- Estado del pago
- Cronología de estados
- Opción de reembolso


### 5.7 Gestión de Cupones (`/gestion-fm/cupones`)

**Descripción:** Sistema de cupones de descuento.

**Tipos de cupones:**
- Porcentaje fijo (ej: 15%)
- Cantidad fija (ej: 10 EUR)
- Envío gratis

**Campos:**
- Código del cupón *
- Tipo de descuento *
- Valor *
- Fecha de inicio
- Fecha de expiración
- Usos máximos
- Mínimo de compra
- Categorías aplicables


### 5.8 Gestión de Promociones (`/gestion-fm/promociones`)

**Descripción:** Sistema de promociones automáticas aplicables a productos.

**Características:**
- Título de la promoción
- Descripción
- Tipo (porcentaje/cantidad)
- Productos o categorías aplicables
- Vigencia (fecha inicio/fin)
- Prioridad (si hay múltiples promociones)


### 5.9 Gestión de Usuarios (`/gestion-fm/usuarios`)

**Descripción:** Administración de usuarios registrados.

**Funcionalidades:**
- Lista de usuarios con email, fecha registro
- Filtros por tipo de usuario (admin/cliente)
- Búsqueda por email
- Cambio de rol
- Bloqueo/Desbloqueo de cuenta


### 5.10 Gestión Editorial (`/gestion-fm/editorial`)

**Descripción:** CMS para gestionar artículos del blog.

**Vista de listado:**
- Tabla con: Título, Estado (Borrador/Publicado), Autor, Fecha
- Búsqueda y filtros
- Botón "+ Nuevo Artículo"


### 5.11 Crear/Editar Artículo (`/gestion-fm/editorial/nuevo` o `/[id]`)

**Editor de artículos:**
- Título *
- Slug (auto-generado)
- Extracto / Resumen
- Contenido principal (editor rich text)
- Imagen destacada
- Categoría del artículo
- Tags
- Estado: Borrador / Publicado
- Fecha de publicación programada
- SEO (meta título, descripción)


### 5.12 Diseño Homepage (`/gestion-fm/diseno`)

**Descripción:** Configurador visual del layout de la homepage.

**Funcionalidades:**
- Lista de secciones disponibles:
  - Hero
  - Offer Banner
  - Categories Grid
  - Featured Products
  - Value Props
  - Custom Text Sections
- Drag & drop para reordenar secciones
- Toggle de visibilidad por sección
- Configuración específica de cada sección:
  - Textos personalizados
  - Imágenes
  - Links
  - Estilos (colores, tamaños)
- Preview en tiempo real
- Botón "Guardar Cambios" (actualiza tabla `home_sections`)

---

## 6. PÁGINAS DE INFORMACIÓN

### 6.1 Editorial - Listado (`/editorial`)

**Descripción:** Blog público con artículos sobre moda y tendencias.

**Vista:**
- Hero section con título "EDITORIAL"
- Subtítulo descriptivo
- Grid de artículos (3 columnas desktop, 1 móvil)
- Card de artículo:
  - Imagen placeholder
  - Fecha de publicación
  - Título del artículo
  - Extracto (máx 3 líneas)
  - Link "Leer artículo →"
- Estado vacío si no hay artículos


### 6.2 Editorial - Detalle (`/editorial/[slug]`)

**Descripción:** Vista completa de un artículo individual.

**Elementos:**
- Imagen destacada (hero)
- Fecha de publicación
- Título principal
- Contenido formateado (HTML/Markdown)
- Información del autor
- Botones de compartir en redes sociales
- Artículos relacionados
- Sección de comentarios (planificado)


### 6.3 Términos y Condiciones (`/legal/terminos`)

**Contenido estático con información legal.**


### 6.4 Política de Privacidad (`/legal/privacidad`)

**Contenido estático con GDPR compliance.**


### 6.5 Política de Cookies (`/legal/cookies`)

**Información sobre uso de cookies.**


### 6.6 Política de Devoluciones (`/legal/devoluciones`)

**Proceso de devoluciones y garantías.**


### 6.7 Contacto (`/info/contacto`)

**Descripción:** Formulario de contacto y datos de la empresa.

**Elementos:**
- Formulario de contacto:
  - Nombre *
  - Email *
  - Asunto *
  - Mensaje *
  - Botón "Enviar"
- Información de contacto:
  - Teléfono
  - Email corporativo
  - Dirección física
  - Horarios de atención
- Mapa integrado (opcional)


### 6.8 Información de Envío (`/info/envio`)

**Contenido informativo sobre:**
- Tiempos de envío por región
- Costos de envío
- Transportistas utilizados
- Seguimiento de pedidos
- Política de envío gratis

---

## 7. Páginas de Error

### 7.1 404 - No Encontrado (`/404`)

**Descripción:** Página personalizada de error 404.

**Elementos:**
- Mensaje "Página no encontrada"
- Diseño acorde a la marca
- Sugerencias de navegación
- Botón "Volver al inicio"


### 7.2 500 - Error del Servidor (`/500`)

**Descripción:** Página de error interno del servidor.

**Elementos:**
- Mensaje "Algo salió mal"
- Diseño profesional
- Botón para reportar el error
- Botón "Volver al inicio"

---

## Funcionalidades Globales

### Carrito de Compras
- **Implementación:** Nanostores (estado global persistente)
- **Características:**
  - Añadir/eliminar productos
  - Cambio de cantidad
  - Selección de variantes (tallas)
  - Cálculo automático de subtotal
  - Aplicación de cupones
  - Persistencia en localStorage
  - Icono con badge de cantidad en header
  - Mini-carrito desplegable (dropdown)

### Sistema de Cupones
- Validación de códigos
- Aplicación automática de descuentos
- Restricciones por:
  - Mínimo de compra
  - Categorías específicas
  - Fecha de validez
  - Usos máximos

### Sistema de Promociones
- Cálculo automático de descuentos por producto
- Función `enrichProductsWithDiscounts()` que:
  - Verifica promociones activas
  - Aplica descuento al precio
  - Añade badge promocional
  - Muestra precio original tachado

### Integración con Cloudinary
- Optimización automática de imágenes
- Responsive images con srcset
- Transformaciones on-the-fly (resize, crop, quality)
- Presets predefinidos:
  - `product`: 700x800
  - `thumbnail`: 200x200
  - `category`: dimensiones variables

### Autenticación & Autorización
- Login con email/contraseña
- Recuperación de contraseña
- Cookies de sesión seguras
- Middleware de protección de rutas admin
- Sesión persistente con refresh tokens

### Integraciones de Pago (Stripe)
- Checkout sessions
- Webhooks para confirmación
- Soporte multi-moneda
- Guardado de métodos de pago

---

## Comandos Útiles

```bash
# Desarrollo
npm run dev              # Inicia servidor en localhost:4321

# Producción
npm run build            # Construye el proyecto
npm run preview          # Preview del build

# Optimización
npm run optimize:images  # Optimiza imágenes con Cloudinary
```

---

## Variables de Entorno Requeridas

```env
# Supabase
PUBLIC_SUPABASE_URL=
PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# Email
NODEMAILER_HOST=
NODEMAILER_USER=
NODEMAILER_PASS=
```

---

## Base de Datos (Supabase)

### Tablas Principales

**products**
- id (uuid)
- name (text)
- slug (text, unique)
- description (text)
- price (integer, en centavos)
- stock (integer)
- images (text[], array de URLs)
- category_id (uuid, FK)
- featured (boolean)
- created_at, updated_at

**categories**
- id (uuid)
- name (text)
- slug (text, unique)
- description (text)
- image_url (text)
- order_index (integer)

**product_variants**
- id (uuid)
- product_id (uuid, FK)
- size (text)
- stock (integer)
- sku (text, opcional)

**coupons**
- id (uuid)
- code (text, unique)
- discount_type (enum: 'percentage', 'fixed', 'free_shipping')
- discount_value (integer)
- min_purchase (integer, nullable)
- max_uses (integer, nullable)
- current_uses (integer)
- valid_from, valid_until
- is_active (boolean)

**promotions**
- id (uuid)
- title (text)
- description (text)
- discount_type, discount_value
- applies_to (enum: 'all', 'category', 'product')
- target_ids (uuid[], array)
- valid_from, valid_until
- is_active (boolean)
- priority (integer)

**home_sections**
- id (uuid)
- key (text, unique)
- component_name (text)
- is_visible (boolean)
- order_index (integer)
- config (jsonb, configuración específica)

**articles**
- id (uuid)
- title (text)
- slug (text, unique)
- excerpt (text)
- content (text, markdown/HTML)
- cover_image (text)
- published_at (timestamp, nullable)
- author_id (uuid, FK a users)

**orders** (próximamente)
- id (uuid)
- user_id (uuid)
- total_amount (integer)
- status (enum)
- shipping_address (jsonb)
- payment_intent_id (text, Stripe)
- created_at

**order_items** (próximamente)
- id (uuid)
- order_id (uuid, FK)
- product_id (uuid, FK)
- variant_id (uuid, FK, nullable)
- quantity (integer)
- price_at_purchase (integer)

---

## Diagramas de Flujo Principales

### Flujo de Compra

```
[Navegación en tienda]
         ↓
[Añadir al carrito]
         ↓
[Ver carrito] ─→ [Aplicar cupón (opcional)]
         ↓
[Ir a checkout]
         ↓
[Completar formulario de datos]
         ↓
[Proceso de pago con Stripe]
         ↓
[Confirmación] → [Email de confirmación]
         ↓
[Página de éxito con número de pedido]
```

### Flujo de Administración de Productos

```
[Login admin]
      ↓
[Dashboard]
      ↓
[Gestión de productos]
      ↓
[Crear producto]
      ├─→ [Upload imágenes a Cloudinary]
      ├─→ [Definir variantes]
      ├─→ [Asignar categoría]
      └─→ [Guardar en Supabase]
            ↓
      [Producto visible en tienda]
```

---

## Próximas Funcionalidades

### En desarrollo
- [ ] Sistema completo de pedidos
- [ ] Webhooks de Stripe
- [ ] Generación de facturas PDF
- [ ] Notificaciones por email automatizadas

### Planeadas
- [ ] Sistema de reseñas de productos
- [ ] Wishlist (lista de deseos)
- [ ] Comparador de productos
- [ ] Sistema de puntos/fidelidad
- [ ] Chat en vivo
- [ ] Integración con redes sociales
- [ ] Progressive Web App (PWA)

---

## Notas de Diseño

### Paleta de Colores
- **Navy:** #1a2332 (textos principales, headers)
- **Charcoal:** #4a5568 (textos secundarios)
- **Cream:** #faf9f6 (fondos)
- **Leather/Accent:** #d97706 (CTAs, destacados)
- **Slate-950:** Fondo oscuro del catálogo
- **White:** #ffffff (cards, overlays)

### Tipografía
- **Display:** Para títulos y nombres destacados (font-display class)
- **Sans-serif:** Para cuerpo de texto
- Tamaños responsive con clases de Tailwind (text-xl, lg:text-2xl, etc.)

### Espaciado
- Padding consistente: px-4 sm:px-6 lg:px-8
- Max-width container: max-w-7xl
- Gaps en grids: gap-4 lg:gap-6

---

## Recursos Adicionales

### Presentación del Proyecto
- [Presentación en Canva](https://www.canva.com/design/DAHBkd5vmVY/ZeWv100ZHSdPfu9wtTln6g/edit?utm_content=DAHBkd5vmVY&utm_campaign=designshare&utm_medium=link2&utm_source=sharebutton)

### Documentación Oficial
- [Astro Docs](https://docs.astro.build)
- [Supabase Docs](https://supabase.com/docs)
- [Stripe Docs](https://stripe.com/docs)
- [Cloudinary Docs](https://cloudinary.com/documentation)
- [TailwindCSS Docs](https://tailwindcss.com/docs)

### Repositorio
- Código fuente en: `c:\Users\RBX\Documents\FashionStore`
- Server dev: `http://localhost:4321`

---

**Última actualización:** 2026-02-17
**Versión de la documentación:** 1.0
