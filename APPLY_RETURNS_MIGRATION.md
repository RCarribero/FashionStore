# Apply Returns Migration

## What Was Fixed

### Problem 1: Order cancellations didn't create return requests
**Solution**: Updated the `cancel_order` database function to automatically create a return request entry when a user cancels an order.

### Problem 2: Sidebar navigation not showing "Devoluciones"
**Solution**: The navigation is correctly configured. If you don't see it, try:
1. Hard refresh the browser (Ctrl + Shift + R)
2. Clear browser cache
3. Restart the dev server

---

## How to Apply the Migration

### Option 1: Using Supabase CLI (Recommended)

```powershell
# Make sure you're in the project directory
cd c:\Users\RBX\Documents\FashionStore

# Login to Supabase if not already logged in
supabase login

# Link your project (if not already linked)
supabase link --project-ref YOUR_PROJECT_REF

# Apply the migration
supabase db push
```

### Option 2: Run SQL Directly in Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the content from:
   - `supabase/migrations/update_cancel_order_function.sql`
4. Click **Run** to execute the SQL

---

## Testing the Fix

### Test 1: Cancel an Order

1. As a logged-in user, go to your orders page
2. Cancel a pending order
3. Check that it works without errors
4. Log in as admin and go to `/gestion-fm/devoluciones`
5. You should see the cancelled order listed with:
   - **Reason**: "Cancelado por usuario"
   - **Status**: Badge amarillo "Pendiente"

### Test 2: Verify Admin Navigation

1. Go to `/gestion-fm` (admin dashboard)
2. Check the left sidebar
3. You should see "Devoluciones" with a return icon between "Pedidos" and "Usuarios"

### Test 3: Check Dashboard Widget

1. On the admin dashboard
2. You should see a new card showing "Devoluciones Pendientes"
3. Click on it to filter pending returns

---

## What Changed in the Database

The `cancel_order()` function now:
1. Restores product stock (existing behavior)
2. **NEW**: Creates an entry in the `returns` table with:
   - `reason`: "cancelled_by_user"
   - `status`: "pending"
   - `details`: "Pedido cancelado por el usuario antes del envío"
3. Updates order status to "cancelled"
4. Returns the new `returnId` in the response

---

## Troubleshooting

### Issue: "Property 'RETURNS' does not exist" TypeScript error
**Solution**: This is a language server cache issue. The routes are correctly defined.
- Restart TypeScript server: `Ctrl + Shift + P` → "TypeScript: Restart TS Server"
- Or just restart VS Code

### Issue: Sidebar still doesn't show "Devoluciones"
**Solution**: 
1. Check browser console for JavaScript errors
2. Hard refresh: `Ctrl + Shift + R`
3. Check that you're logged in as an admin user (check `user_profiles.is_admin = true`)

### Issue: Old cancelled orders don't appear
**Expected**: Only orders cancelled AFTER applying this migration will create return entries.
- Old cancelled orders won't retroactively appear in the returns list
- This is by design to avoid duplicates

---

## Files Modified

- ✅ `supabase/schema.sql` - Updated `cancel_order` function
- ✅ `supabase/migrations/update_cancel_order_function.sql` - New migration file
- ✅ `src/pages/gestion-fm/devoluciones/index.astro` - Added "Cancelado por usuario" label
- ✅ `src/pages/gestion-fm/devoluciones/[id].astro` - Added "Cancelado por usuario" label
- ✅ `src/pages/api/returns/create.ts` - Added "Cancelado por usuario" label

---

## Next Steps After Migration

1. Apply the migration using one of the options above
2. Restart your dev server: `npm run dev`
3. Test cancelling an order as a user
4. Check the admin panel for the new return request
5. Verify the sidebar shows "Devoluciones"

If you encounter any issues, check the terminal output and browser console for error messages.
