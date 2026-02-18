# FashionMarket

Plataforma e-commerce de moda masculina premium desarrollada con Astro, React, TailwindCSS y Supabase.

## Stack

- **Framework:** Astro v5 (SSR con Node adapter)
- **UI:** React 19 + TailwindCSS 3
- **Backend:** Supabase (PostgreSQL + Auth)
- **Pagos:** Stripe
- **Imagenes:** Cloudinary
- **Email:** Nodemailer
- **Estado:** Nanostores

## Instalacion

```bash
npm install
```

## Variables de entorno

Crea un archivo `.env` en la raiz con las siguientes variables:

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

# Email (Nodemailer)
NODEMAILER_HOST=
NODEMAILER_USER=
NODEMAILER_PASS=
```

## Desarrollo

```bash
npm run dev        # Servidor en http://localhost:4321
```

## Produccion

```bash
npm run build      # Build de produccion
npm run preview    # Preview del build
```

## Estructura del proyecto

```
src/
├── config/          # Rutas y constantes
├── modules/
│   ├── admin/       # Panel de administracion (/gestion-fm)
│   ├── auth/        # Autenticacion
│   ├── store/       # Tienda publica
│   └── checkout/    # Proceso de compra
├── pages/           # Rutas de Astro
├── shared/          # Componentes y utilidades compartidas
└── lib/             # Servicios externos (Supabase, Cloudinary, Stripe)
```

## Deploy

Configurado para deploy con Nixpacks (Railway). Ver `nixpacks.toml`.

## Documentacion

Consulta [DOCUMENTACION.md](./DOCUMENTACION.md) para la documentacion completa del proyecto.
