# Apply Returns Migration Script
# This script applies the database migration to update the cancel_order function

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "  Returns Migration Applicator" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
Write-Host "Checking Supabase CLI installation..." -ForegroundColor Yellow
$supabaseCmd = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseCmd) {
    Write-Host "ERROR: Supabase CLI is not installed." -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install it first:" -ForegroundColor Yellow
    Write-Host "  npm install -g supabase" -ForegroundColor White
    Write-Host ""
    Write-Host "Or apply the migration manually via Supabase Dashboard (see APPLY_RETURNS_MIGRATION.md)" -ForegroundColor Yellow
    exit 1
}

Write-Host "Supabase CLI found!" -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "supabase/migrations/update_cancel_order_function.sql")) {
    Write-Host "ERROR: Migration file not found." -ForegroundColor Red
    Write-Host "Make sure you're in the project root directory." -ForegroundColor Yellow
    exit 1
}

Write-Host "Migration file found!" -ForegroundColor Green
Write-Host ""

# Ask for confirmation
Write-Host "This will update the cancel_order function in your Supabase database." -ForegroundColor Yellow
Write-Host "After this migration, cancelled orders will automatically create return requests." -ForegroundColor Yellow
Write-Host ""
$confirm = Read-Host "Do you want to continue? (y/N)"

if ($confirm -ne "y" -and $confirm -ne "Y") {
    Write-Host "Migration cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Applying migration..." -ForegroundColor Cyan

# Apply the migration
try {
    supabase db push
    
    Write-Host ""
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host "  Migration Applied Successfully!" -ForegroundColor Green
    Write-Host "=====================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Restart your dev server if it's running" -ForegroundColor White
    Write-Host "2. Test cancelling an order as a user" -ForegroundColor White
    Write-Host "3. Check /gestion-fm/devoluciones in the admin panel" -ForegroundColor White
    Write-Host ""
    Write-Host "The cancelled order should now appear in the returns list!" -ForegroundColor Green
    
} catch {
    Write-Host ""
    Write-Host "ERROR: Migration failed." -ForegroundColor Red
    Write-Host "Error details: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please try applying the migration manually:" -ForegroundColor Yellow
    Write-Host "1. Open Supabase Dashboard" -ForegroundColor White
    Write-Host "2. Go to SQL Editor" -ForegroundColor White
    Write-Host "3. Copy content from supabase/migrations/update_cancel_order_function.sql" -ForegroundColor White
    Write-Host "4. Run the SQL" -ForegroundColor White
    exit 1
}
