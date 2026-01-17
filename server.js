const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'your-secret-key'; // Change this to a secure secret

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// MySQL connection
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root', // Change this to your MySQL username
    password: '', // Change this to your MySQL password
    database: 'todo'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        return;
    }
    console.log('Connected to MySQL database');
});

// Handle connection errors
db.on('error', (err) => {
    console.error('MySQL connection error:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.log('MySQL connection lost, attempting to reconnect...');
        // Reconnect logic could be added here
    } else {
        console.error('Unhandled MySQL error:', err);
        // Don't throw, just log
    }
});

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}

// Routes

// Sign up
app.post('/api/signup', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if user already exists
        db.query('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], async (err, results) => {
            if (err) return res.status(500).json({ error: 'Database error' });

            if (results.length > 0) {
                return res.status(400).json({ error: 'Username or email already exists' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert new user
            db.query('INSERT INTO users (username, email, password) VALUES (?, ?, ?)', [username, email, hashedPassword], (err, result) => {
                if (err) return res.status(500).json({ error: 'Database error' });

                res.status(201).json({ message: 'User created successfully' });
            });
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Sign in
app.post('/api/signin', (req, res) => {
    const { username, password } = req.body;

    db.query('SELECT * FROM users WHERE username = ?', [username], async (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });

        if (results.length === 0) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        const user = results[0];
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(400).json({ error: 'Invalid username or password' });
        }

        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
        res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
    });
});

// Get tasks
app.get('/api/tasks', authenticateToken, (req, res) => {
    db.query('SELECT * FROM tasks WHERE user_id = ?', [req.user.id], (err, results) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json(results);
    });
});

// Add task
app.post('/api/tasks', authenticateToken, (req, res) => {
    const { text } = req.body;
    db.query('INSERT INTO tasks (user_id, text) VALUES (?, ?)', [req.user.id, text], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.status(201).json({ id: result.insertId, text, completed: false });
    });
});

// Update task
app.put('/api/tasks/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    const { text, completed } = req.body;
    db.query('UPDATE tasks SET text = ?, completed = ? WHERE id = ? AND user_id = ?', [text, completed, id, req.user.id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Task not found' });
        res.json({ message: 'Task updated' });
    });
});

// Delete task
app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    db.query('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, req.user.id], (err, result) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Task not found' });
        res.json({ message: 'Task deleted' });
    });
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'signin.html'));
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});