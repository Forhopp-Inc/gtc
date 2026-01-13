-- WARNING: This script deletes ALL data from the database.
-- Use with caution!

-- Truncate all tables containing business data
TRUNCATE TABLE 
    order_items, 
    orders, 
    payments, 
    transactions, 
    investor_transactions, 
    customers, 
    products, 
    companies, 
    officers, 
    investors, 
    expenses
    RESTART IDENTITY CASCADE;

-- Clear users
TRUNCATE TABLE users RESTART IDENTITY CASCADE;

-- Re-seed default users
INSERT INTO users (name, username, password_hash)
VALUES ('Admin User', 'admin', '$2b$10$9YvN2WYPkhxyMvgWKeHYPuuhI6XF0Rn51Rva4eW7M43YQUjqX3jEC')
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (name, username, password_hash)
VALUES ('Hassan', 'hassan', '$2b$10$koz3Uckkt0KEq2GNQ92uoujUgNNlkH3OG5YlYvF7Q334fBsfBJF7e')
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (name, username, password_hash)
VALUES ('Hammad Nasir', 'hammadnasir', '$2b$10$s3LtF.SXRvPsXzANn0g81.TPUtl2G1xYfiDC/WRQLhYbL8XlYeSFW')
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (name, username, password_hash)
VALUES ('Nasir Mahmood', 'nasir123', '$2b$10$nilY7LrFfbAeY80.Ozv0cOmt9lJoGNBdRKh5slXy9MI9Uuup5.G8m')
ON CONFLICT (username) DO NOTHING;

INSERT INTO users (name, username, password_hash)
VALUES ('Huzaifa Karamat', 'huzaifa123', '$2b$10$pT9KAYS.GrXH35uVkHzDo.KkZVJHSQn82JCSkxggb6jSOThPBKI2y')
ON CONFLICT (username) DO NOTHING;
