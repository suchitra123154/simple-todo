-- Clear all data from Todo database
-- WARNING: This will delete all users and tasks permanently!

USE Todo;

-- Delete all tasks first (due to foreign key constraint)
DELETE FROM tasks;

-- Delete all users
DELETE FROM users;

-- Reset auto-increment counters (optional)
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE tasks AUTO_INCREMENT = 1;

SELECT 'All data has been cleared from the Todo database' AS message;