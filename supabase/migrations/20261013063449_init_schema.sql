-- profiles -------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  phone text,
  role text not null default 'customer' check (role in ('customer', 'admin')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles where id = (select auth.uid()) and role = 'admin'
  );
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- catalog --------------------------------------------------------------
create table public.categories (
  id bigint generated always as identity primary key,
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order int not null default 0
);

create table public.products (
  id bigint generated always as identity primary key,
  category_id bigint not null references public.categories(id),
  slug text not null unique,
  name text not null,
  description text,
  price int not null check (price >= 0),
  stock int not null default 0 check (stock >= 0),
  specs jsonb not null default '[]'::jsonb,
  image_url text,
  source_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index products_category_id_idx on public.products(category_id);

-- cart -----------------------------------------------------------------
create table public.cart_items (
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id bigint not null references public.products(id) on delete cascade,
  quantity int not null check (quantity > 0),
  primary key (user_id, product_id)
);
create index cart_items_product_id_idx on public.cart_items(product_id);

-- orders ---------------------------------------------------------------
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'shipping', 'delivered', 'cancelled')),
  order_name text not null,
  total_amount int not null,
  shipping_fee int not null default 0,
  recipient text not null,
  phone text not null,
  address text not null,
  memo text,
  payment_key text,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);
create index orders_user_id_idx on public.orders(user_id);

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id bigint references public.products(id) on delete set null,
  product_name text not null,
  unit_price int not null,
  quantity int not null check (quantity > 0)
);
create index order_items_order_id_idx on public.order_items(order_id);
create index order_items_product_id_idx on public.order_items(product_id);

-- RLS ------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.cart_items enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "profiles: read own or admin" on public.profiles
  for select to authenticated using (id = (select auth.uid()) or (select public.is_admin()));
create policy "profiles: update own" on public.profiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- prevent users from promoting themselves
create or replace function public.protect_profile_role()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.role is distinct from old.role and not public.is_admin() then
    new.role := old.role;
  end if;
  return new;
end;
$$;
create trigger protect_profile_role before update on public.profiles
  for each row execute function public.protect_profile_role();

create policy "categories: public read" on public.categories
  for select to anon, authenticated using (true);
create policy "categories: admin write" on public.categories
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "products: public read" on public.products
  for select to anon, authenticated using (is_active or (select public.is_admin()));
create policy "products: admin insert" on public.products
  for insert to authenticated with check ((select public.is_admin()));
create policy "products: admin update" on public.products
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "products: admin delete" on public.products
  for delete to authenticated using ((select public.is_admin()));

create policy "cart: own rows" on public.cart_items
  for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "orders: read own or admin" on public.orders
  for select to authenticated using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "orders: admin update" on public.orders
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

create policy "order_items: read own or admin" on public.order_items
  for select to authenticated using (
    exists (select 1 from public.orders o where o.id = order_id
            and (o.user_id = (select auth.uid()) or (select public.is_admin())))
  );

-- order creation: prices are always taken from the DB, never the client
create or replace function public.create_order(
  p_items jsonb, p_recipient text, p_phone text, p_address text, p_memo text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_order_id uuid;
  v_total int := 0;
  v_fee int;
  v_first text;
  v_count int := 0;
  r record;
begin
  if v_uid is null then
    raise exception 'login required';
  end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'empty order';
  end if;

  insert into public.orders (user_id, order_name, total_amount, recipient, phone, address, memo)
  values (v_uid, '', 0, p_recipient, p_phone, p_address, p_memo)
  returning id into v_order_id;

  for r in
    select p.id, p.name, p.price, p.stock, (i ->> 'quantity')::int as qty
    from jsonb_array_elements(p_items) i
    join public.products p on p.id = (i ->> 'product_id')::bigint and p.is_active
  loop
    if r.qty is null or r.qty < 1 then
      raise exception 'invalid quantity';
    end if;
    if r.stock < r.qty then
      raise exception 'out of stock: %', r.name;
    end if;
    insert into public.order_items (order_id, product_id, product_name, unit_price, quantity)
    values (v_order_id, r.id, r.name, r.price, r.qty);
    v_total := v_total + r.price * r.qty;
    v_count := v_count + 1;
    if v_first is null then v_first := r.name; end if;
  end loop;

  if v_count = 0 then
    raise exception 'no valid items';
  end if;

  v_fee := case when v_total >= 50000 then 0 else 3000 end;

  update public.orders
  set total_amount = v_total + v_fee,
      shipping_fee = v_fee,
      order_name = case when v_count > 1 then v_first || ' 외 ' || (v_count - 1) || '건' else v_first end
  where id = v_order_id;

  return v_order_id;
end;
$$;

revoke execute on function public.create_order(jsonb, text, text, text, text) from public, anon;
grant execute on function public.create_order(jsonb, text, text, text, text) to authenticated;

-- called only by the payments edge function (service role) after Toss confirms
create or replace function public.finalize_order_paid(p_order_id uuid, p_payment_key text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
begin
  update public.orders
  set status = 'paid', payment_key = p_payment_key, paid_at = now()
  where id = p_order_id and status = 'pending';
  if not found then
    raise exception 'order not pending';
  end if;

  for r in select product_id, quantity from public.order_items where order_id = p_order_id loop
    update public.products set stock = greatest(stock - r.quantity, 0) where id = r.product_id;
  end loop;

  delete from public.cart_items c
  using public.orders o
  where o.id = p_order_id and c.user_id = o.user_id
    and c.product_id in (select product_id from public.order_items where order_id = p_order_id);
end;
$$;

revoke execute on function public.finalize_order_paid(uuid, text) from public, anon, authenticated;
grant execute on function public.finalize_order_paid(uuid, text) to service_role;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_profile_role() from public, anon, authenticated;

-- storage bucket for admin-uploaded product images ---------------------
insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product-images: admin upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'product-images' and (select public.is_admin()));
create policy "product-images: admin update" on storage.objects
  for update to authenticated using (bucket_id = 'product-images' and (select public.is_admin()));
create policy "product-images: admin delete" on storage.objects
  for delete to authenticated using (bucket_id = 'product-images' and (select public.is_admin()));
