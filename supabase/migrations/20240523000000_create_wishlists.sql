-- Create wishlists table
create table if not exists public.wishlists (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    product_id uuid references public.products(id) on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, product_id)
);

-- RLS Policies
alter table public.wishlists enable row level security;

create policy "Users can view their own wishlist"
    on public.wishlists for select
    using (auth.uid() = user_id);

create policy "Users can insert into their own wishlist"
    on public.wishlists for insert
    with check (auth.uid() = user_id);

create policy "Users can delete from their own wishlist"
    on public.wishlists for delete
    using (auth.uid() = user_id);
