-- Seed initial drink products
INSERT INTO products (name, brand, quantity, min_stock_level, image_url, price) VALUES
  ('Heineken 500ml', 'Heineken', 48, 12, '/placeholder.svg?height=200&width=200', 1500),
  ('Heineken 330ml', 'Heineken', 72, 24, '/placeholder.svg?height=200&width=200', 1000),
  ('Fanta Orange 500ml', 'Fanta', 60, 20, '/placeholder.svg?height=200&width=200', 500),
  ('Fanta Citron 500ml', 'Fanta', 36, 15, '/placeholder.svg?height=200&width=200', 500),
  ('Primus 500ml', 'Primus', 96, 30, '/placeholder.svg?height=200&width=200', 800),
  ('Primus 330ml', 'Primus', 120, 40, '/placeholder.svg?height=200&width=200', 600),
  ('Mutzig 500ml', 'Mutzig', 48, 15, '/placeholder.svg?height=200&width=200', 900),
  ('Skol 500ml', 'Skol', 60, 20, '/placeholder.svg?height=200&width=200', 700),
  ('Coca-Cola 500ml', 'Coca-Cola', 84, 25, '/placeholder.svg?height=200&width=200', 500),
  ('Sprite 500ml', 'Sprite', 48, 15, '/placeholder.svg?height=200&width=200', 500),
  ('Inyange Water 500ml', 'Inyange', 144, 50, '/placeholder.svg?height=200&width=200', 300),
  ('Inyange Juice 500ml', 'Inyange', 36, 12, '/placeholder.svg?height=200&width=200', 600)
ON CONFLICT DO NOTHING;
