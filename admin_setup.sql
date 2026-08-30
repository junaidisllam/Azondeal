-- Create Admin User SQL Script
-- Name: Junaid Ahmed
-- Email: admin@azondeal.com
-- Password: Fahim(99) (Stored as BCrypt Hash)

INSERT INTO Admin (name, email, password, createdAt, updatedAt) 
VALUES (
    'Junaid Ahmed', 
    'admin@azondeal.com', 
    '$2b$10$YBaZjdJI1fMDEzk/AvilOuPNDFk4nbRjn/Z/4lpvZe1plzCW71b.6', 
    NOW(), 
    NOW()
) 
ON DUPLICATE KEY UPDATE 
    name = VALUES(name),
    password = VALUES(password),
    updatedAt = NOW();
