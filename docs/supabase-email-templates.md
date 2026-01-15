# Email Templates para Supabase Authentication

Copia estos templates en **Supabase Dashboard > Authentication > Email Templates**

---

## 1. Confirm Signup (Confirmar Registro)

**Subject:** Confirma tu cuenta en FashionMarket

**Body:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <tr>
            <td style="background-color: #1e293b; padding: 40px; border-radius: 8px;">
                <h1 style="margin: 0 0 30px; color: #fff; font-size: 28px; text-align: center;">
                    FASHION<span style="color: #ef4444;">MARKET</span>
                </h1>
                
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 50px; margin-bottom: 15px;">📧</div>
                    <h2 style="color: #fff; margin: 0 0 10px; font-size: 22px;">Confirma tu Email</h2>
                    <p style="color: #94a3b8; margin: 0 0 30px; font-size: 16px;">
                        Gracias por registrarte. Haz clic en el boton para activar tu cuenta.
                    </p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="{{ .ConfirmationURL }}" 
                       style="display: inline-block; padding: 16px 40px; background-color: #ef4444; color: #fff; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">
                        Confirmar Cuenta
                    </a>
                </div>

                <p style="text-align: center; color: #64748b; font-size: 13px; margin-top: 30px;">
                    Si no creaste esta cuenta, puedes ignorar este email.
                </p>

                <p style="text-align: center; color: #334155; font-size: 11px; margin-top: 40px; border-top: 1px solid #334155; padding-top: 20px;">
                    © 2025 FashionMarket - Todos los derechos reservados
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## 2. Reset Password (Restablecer Contrasena)

**Subject:** Restablece tu contrasena - FashionMarket

**Body:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <tr>
            <td style="background-color: #1e293b; padding: 40px; border-radius: 8px;">
                <h1 style="margin: 0 0 30px; color: #fff; font-size: 28px; text-align: center;">
                    FASHION<span style="color: #ef4444;">MARKET</span>
                </h1>
                
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 50px; margin-bottom: 15px;">🔐</div>
                    <h2 style="color: #fff; margin: 0 0 10px; font-size: 22px;">Restablecer Contrasena</h2>
                    <p style="color: #94a3b8; margin: 0 0 30px; font-size: 16px;">
                        Recibimos una solicitud para restablecer tu contrasena.
                    </p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="{{ .ConfirmationURL }}" 
                       style="display: inline-block; padding: 16px 40px; background-color: #ef4444; color: #fff; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">
                        Cambiar Contrasena
                    </a>
                </div>

                <div style="background-color: #0f172a; border-radius: 6px; padding: 15px; margin: 20px 0;">
                    <p style="color: #fbbf24; margin: 0; font-size: 13px; text-align: center;">
                        ⚠️ Este enlace expira en 1 hora
                    </p>
                </div>

                <p style="text-align: center; color: #64748b; font-size: 13px; margin-top: 30px;">
                    Si no solicitaste este cambio, ignora este email. Tu contrasena seguira siendo la misma.
                </p>

                <p style="text-align: center; color: #334155; font-size: 11px; margin-top: 40px; border-top: 1px solid #334155; padding-top: 20px;">
                    © 2025 FashionMarket - Todos los derechos reservados
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## 3. Magic Link (Enlace Magico)

**Subject:** Tu enlace de acceso - FashionMarket

**Body:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <tr>
            <td style="background-color: #1e293b; padding: 40px; border-radius: 8px;">
                <h1 style="margin: 0 0 30px; color: #fff; font-size: 28px; text-align: center;">
                    FASHION<span style="color: #ef4444;">MARKET</span>
                </h1>
                
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 50px; margin-bottom: 15px;">✨</div>
                    <h2 style="color: #fff; margin: 0 0 10px; font-size: 22px;">Accede a tu Cuenta</h2>
                    <p style="color: #94a3b8; margin: 0 0 30px; font-size: 16px;">
                        Haz clic en el boton para iniciar sesion automaticamente.
                    </p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="{{ .ConfirmationURL }}" 
                       style="display: inline-block; padding: 16px 40px; background-color: #ef4444; color: #fff; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">
                        Iniciar Sesion
                    </a>
                </div>

                <p style="text-align: center; color: #64748b; font-size: 13px; margin-top: 30px;">
                    Este enlace solo funciona una vez y expira en 1 hora.
                </p>

                <p style="text-align: center; color: #334155; font-size: 11px; margin-top: 40px; border-top: 1px solid #334155; padding-top: 20px;">
                    © 2025 FashionMarket - Todos los derechos reservados
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## 4. Change Email (Cambiar Email)

**Subject:** Confirma tu nuevo email - FashionMarket

**Body:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <tr>
            <td style="background-color: #1e293b; padding: 40px; border-radius: 8px;">
                <h1 style="margin: 0 0 30px; color: #fff; font-size: 28px; text-align: center;">
                    FASHION<span style="color: #ef4444;">MARKET</span>
                </h1>
                
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 50px; margin-bottom: 15px;">📬</div>
                    <h2 style="color: #fff; margin: 0 0 10px; font-size: 22px;">Confirma tu Nuevo Email</h2>
                    <p style="color: #94a3b8; margin: 0 0 30px; font-size: 16px;">
                        Solicitaste cambiar tu direccion de email. Confirma haciendo clic abajo.
                    </p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="{{ .ConfirmationURL }}" 
                       style="display: inline-block; padding: 16px 40px; background-color: #ef4444; color: #fff; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">
                        Confirmar Cambio
                    </a>
                </div>

                <p style="text-align: center; color: #64748b; font-size: 13px; margin-top: 30px;">
                    Si no solicitaste este cambio, contactanos inmediatamente.
                </p>

                <p style="text-align: center; color: #334155; font-size: 11px; margin-top: 40px; border-top: 1px solid #334155; padding-top: 20px;">
                    © 2025 FashionMarket - Todos los derechos reservados
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## 5. Invite User (Invitar Usuario)

**Subject:** Has sido invitado a FashionMarket

**Body:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <tr>
            <td style="background-color: #1e293b; padding: 40px; border-radius: 8px;">
                <h1 style="margin: 0 0 30px; color: #fff; font-size: 28px; text-align: center;">
                    FASHION<span style="color: #ef4444;">MARKET</span>
                </h1>
                
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 50px; margin-bottom: 15px;">🎉</div>
                    <h2 style="color: #fff; margin: 0 0 10px; font-size: 22px;">Estas Invitado</h2>
                    <p style="color: #94a3b8; margin: 0 0 30px; font-size: 16px;">
                        Has sido invitado a unirte a FashionMarket. Acepta la invitacion para crear tu cuenta.
                    </p>
                </div>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="{{ .ConfirmationURL }}" 
                       style="display: inline-block; padding: 16px 40px; background-color: #ef4444; color: #fff; text-decoration: none; font-weight: bold; font-size: 16px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;">
                        Aceptar Invitacion
                    </a>
                </div>

                <p style="text-align: center; color: #334155; font-size: 11px; margin-top: 40px; border-top: 1px solid #334155; padding-top: 20px;">
                    © 2025 FashionMarket - Todos los derechos reservados
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## Como aplicar los templates

1. Ve a **Supabase Dashboard** > **Authentication** > **Email Templates**
2. Para cada tipo de email:
   - Pega el **Subject** en el campo "Subject"
   - Pega el **Body** (sin los backticks) en el campo "Body"
3. Guarda cada template

> **Nota:** La variable `{{ .ConfirmationURL }}` es automaticamente reemplazada por Supabase con el enlace correcto.

---

## 6. Password Changed (Contrasena Cambiada)

**Subject:** Tu contrasena ha sido cambiada - FashionMarket

**Body:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <tr>
            <td style="background-color: #1e293b; padding: 40px; border-radius: 8px;">
                <h1 style="margin: 0 0 30px; color: #fff; font-size: 28px; text-align: center;">
                    FASHION<span style="color: #ef4444;">MARKET</span>
                </h1>
                
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 50px; margin-bottom: 15px;">🔑</div>
                    <h2 style="color: #fff; margin: 0 0 10px; font-size: 22px;">Contrasena Actualizada</h2>
                    <p style="color: #94a3b8; margin: 0 0 30px; font-size: 16px;">
                        Tu contrasena ha sido cambiada exitosamente.
                    </p>
                </div>

                <div style="background-color: #0f172a; border-radius: 6px; padding: 20px; margin: 20px 0;">
                    <p style="color: #94a3b8; margin: 0; font-size: 14px; text-align: center;">
                        Si no realizaste este cambio, contactanos inmediatamente.
                    </p>
                </div>

                <p style="text-align: center; color: #334155; font-size: 11px; margin-top: 40px; border-top: 1px solid #334155; padding-top: 20px;">
                    © 2025 FashionMarket - Todos los derechos reservados
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## 7. Email Address Changed (Email Cambiado)

**Subject:** Tu email ha sido actualizado - FashionMarket

**Body:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <tr>
            <td style="background-color: #1e293b; padding: 40px; border-radius: 8px;">
                <h1 style="margin: 0 0 30px; color: #fff; font-size: 28px; text-align: center;">
                    FASHION<span style="color: #ef4444;">MARKET</span>
                </h1>
                
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 50px; margin-bottom: 15px;">📧</div>
                    <h2 style="color: #fff; margin: 0 0 10px; font-size: 22px;">Email Actualizado</h2>
                    <p style="color: #94a3b8; margin: 0 0 30px; font-size: 16px;">
                        La direccion de email asociada a tu cuenta ha sido actualizada.
                    </p>
                </div>

                <div style="background-color: #0f172a; border-radius: 6px; padding: 20px; margin: 20px 0;">
                    <p style="color: #fbbf24; margin: 0; font-size: 13px; text-align: center;">
                        ⚠️ Si no solicitaste este cambio, contactanos inmediatamente.
                    </p>
                </div>

                <p style="text-align: center; color: #334155; font-size: 11px; margin-top: 40px; border-top: 1px solid #334155; padding-top: 20px;">
                    © 2025 FashionMarket - Todos los derechos reservados
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## 8. Phone Number Changed (Telefono Cambiado)

**Subject:** Tu telefono ha sido actualizado - FashionMarket

**Body:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <tr>
            <td style="background-color: #1e293b; padding: 40px; border-radius: 8px;">
                <h1 style="margin: 0 0 30px; color: #fff; font-size: 28px; text-align: center;">
                    FASHION<span style="color: #ef4444;">MARKET</span>
                </h1>
                
                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 50px; margin-bottom: 15px;">📱</div>
                    <h2 style="color: #fff; margin: 0 0 10px; font-size: 22px;">Telefono Actualizado</h2>
                    <p style="color: #94a3b8; margin: 0 0 30px; font-size: 16px;">
                        El numero de telefono asociado a tu cuenta ha sido actualizado.
                    </p>
                </div>

                <div style="background-color: #0f172a; border-radius: 6px; padding: 20px; margin: 20px 0;">
                    <p style="color: #94a3b8; margin: 0; font-size: 14px; text-align: center;">
                        Si no realizaste este cambio, contactanos inmediatamente.
                    </p>
                </div>

                <p style="text-align: center; color: #334155; font-size: 11px; margin-top: 40px; border-top: 1px solid #334155; padding-top: 20px;">
                    © 2025 FashionMarket - Todos los derechos reservados
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## Como aplicar los templates

1. Ve a **Supabase Dashboard** > **Authentication** > **Email Templates**
2. Para cada tipo de email:
   - Pega el **Subject** en el campo "Subject"
   - Pega el **Body** (sin los backticks) en el campo "Body"
3. Guarda cada template

> **Nota:** La variable `{{ .ConfirmationURL }}` es automaticamente reemplazada por Supabase con el enlace correcto.
