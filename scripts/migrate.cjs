const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Connection string from user + password
// postgresql://postgres.cnonxgwpcxbaifpjbpzs:[YOUR-PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
const connectionString = 'postgresql://postgres.cnonxgwpcxbaifpjbpzs:Aa%4098526288@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function migrate() {
    console.log('Connecting to Supabase...');
    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected successfully.');

        // Read Schema
        const schemaPath = path.join(__dirname, '..', 'supabase_schema.sql');
        // Note: I need to copy the artifact to the project root or read it from the artifact path
        // For simplicity, I will embed the schema here or assume I copy it.
        // Let's assume I write the SQL content to a file in the project first.

        const sql = `
            create extension if not exists "uuid-ossp";

            create table if not exists ingredients (
                id uuid primary key default uuid_generate_v4(),
                name text not null,
                current_stock numeric not null default 0,
                unit text not null check (unit in ('grams', 'ml', 'pieces')),
                cost_per_unit numeric not null default 0,
                low_stock_threshold numeric not null default 0,
                created_at timestamptz default now(),
                updated_at timestamptz default now()
            );

            create table if not exists products (
                id uuid primary key default uuid_generate_v4(),
                name text not null,
                price numeric not null default 0,
                description text,
                category text default 'General',
                image_url text,
                is_active boolean default true,
                created_at timestamptz default now(),
                updated_at timestamptz default now()
            );

            create table if not exists product_ingredients (
                id uuid primary key default uuid_generate_v4(),
                product_id uuid references products(id) on delete cascade,
                ingredient_id uuid references ingredients(id) on delete cascade,
                quantity numeric not null,
                created_at timestamptz default now()
            );

            create table if not exists sales (
                id uuid primary key default uuid_generate_v4(),
                total numeric not null,
                payment_method text check (payment_method in ('cash', 'card')),
                status text default 'completed',
                date timestamptz default now()
            );

            create table if not exists sale_items (
                id uuid primary key default uuid_generate_v4(),
                sale_id uuid references sales(id) on delete cascade,
                product_id uuid references products(id) on delete set null,
                product_name text not null,
                product_price numeric not null,
                quantity integer not null,
                created_at timestamptz default now()
            );

            create table if not exists purchases (
                id uuid primary key default uuid_generate_v4(),
                ingredient_id uuid references ingredients(id) on delete set null,
                ingredient_name text not null,
                quantity numeric not null,
                cost numeric not null,
                date timestamptz default now(),
                created_at timestamptz default now()
            );

            alter table ingredients enable row level security;
            alter table products enable row level security;
            alter table product_ingredients enable row level security;
            alter table sales enable row level security;
            alter table sale_items enable row level security;
            alter table purchases enable row level security;

            do $$ begin
                create policy "Allow all access" on ingredients for all using (true) with check (true);
            exception when duplicate_object then null; end $$;
            
            do $$ begin
                create policy "Allow all access" on products for all using (true) with check (true);
            exception when duplicate_object then null; end $$;

            do $$ begin
                create policy "Allow all access" on product_ingredients for all using (true) with check (true);
            exception when duplicate_object then null; end $$;

            do $$ begin
                create policy "Allow all access" on sales for all using (true) with check (true);
            exception when duplicate_object then null; end $$;

            do $$ begin
                create policy "Allow all access" on sale_items for all using (true) with check (true);
            exception when duplicate_object then null; end $$;

            do $$ begin
                create policy "Allow all access" on purchases for all using (true) with check (true);
            exception when duplicate_object then null; end $$;
        `;

        console.log('Running migration...');
        await client.query(sql);
        console.log('Migration completed successfully!');

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

migrate();
