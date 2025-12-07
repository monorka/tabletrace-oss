-- TableTrace Sample Data
-- Initial seed data for testing

-- Insert sample users
INSERT INTO users (name, email, created_at, updated_at) VALUES
    ('Alice Johnson', 'alice@example.com', '2025-12-07 10:00:00', '2025-12-07 10:00:00'),
    ('Bob Smith', 'bob@example.com', '2025-12-07 10:30:00', '2025-12-07 10:30:00'),
    ('Charlie Brown', 'charlie@example.com', '2025-12-07 11:00:00', '2025-12-07 11:00:00');

-- Insert sample products
INSERT INTO products (name, description, price, stock, created_at, updated_at) VALUES
    ('Wireless Mouse', 'Ergonomic wireless mouse with USB receiver', 29.99, 100, '2025-12-07 09:00:00', '2025-12-07 09:00:00'),
    ('Mechanical Keyboard', 'RGB mechanical keyboard with Cherry MX switches', 149.99, 50, '2025-12-07 09:00:00', '2025-12-07 09:00:00'),
    ('USB-C Hub', '7-in-1 USB-C hub with HDMI and SD card reader', 49.99, 75, '2025-12-07 09:00:00', '2025-12-07 09:00:00'),
    ('Monitor Stand', 'Adjustable aluminum monitor stand', 79.99, 30, '2025-12-07 09:00:00', '2025-12-07 09:00:00'),
    ('Webcam HD', '1080p HD webcam with built-in microphone', 69.99, 60, '2025-12-07 09:00:00', '2025-12-07 09:00:00');

-- Insert sample orders
INSERT INTO orders (user_id, status, total_amount, created_at, updated_at) VALUES
    (1, 'completed', 179.98, '2025-12-07 11:00:00', '2025-12-07 11:30:00'),
    (2, 'pending', 49.99, '2025-12-07 11:45:00', '2025-12-07 11:45:00'),
    (1, 'shipped', 149.99, '2025-12-07 12:00:00', '2025-12-07 12:30:00');

-- Insert sample order items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, created_at) VALUES
    (1, 1, 1, 29.99, '2025-12-07 11:00:00'),   -- Alice: Wireless Mouse
    (1, 3, 3, 49.99, '2025-12-07 11:00:00'),   -- Alice: USB-C Hub x3
    (2, 3, 1, 49.99, '2025-12-07 11:45:00'),   -- Bob: USB-C Hub
    (3, 2, 1, 149.99, '2025-12-07 12:00:00');  -- Alice: Mechanical Keyboard

