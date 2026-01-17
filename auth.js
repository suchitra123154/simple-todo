// Authentication functions
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

function setCurrentUser(user, token) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('token', token);
}

function getToken() {
    return localStorage.getItem('token');
}

function logout() {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token');
    window.location.href = 'signin.html';
}

// Sign Up functionality
if (document.getElementById('signup-form')) {
    document.getElementById('signup-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;
        const messageDiv = document.getElementById('message');

        if (password !== confirmPassword) {
            messageDiv.textContent = 'Passwords do not match!';
            messageDiv.style.color = 'red';
            return;
        }

        try {
            const response = await fetch('/api/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                // After successful signup, automatically sign them in
                const signinResponse = await fetch('/api/signin', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, email, password })
                });
                const signinData = await signinResponse.json();
                if (signinResponse.ok) {
                    setCurrentUser(signinData.user, signinData.token);
                    messageDiv.textContent = 'Account created and signed in successfully!';
                    messageDiv.style.color = 'green';
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 2000);
                } else {
                    messageDiv.textContent = 'Account created! Please sign in.';
                    messageDiv.style.color = 'green';
                    setTimeout(() => {
                        window.location.href = 'signin.html';
                    }, 2000);
                }
            } else {
                messageDiv.textContent = data.error;
                messageDiv.style.color = 'red';
            }
        } catch (error) {
            messageDiv.textContent = 'An error occurred. Please try again.';
            messageDiv.style.color = 'red';
        }
    });
}

// Sign In functionality
if (document.getElementById('signin-form')) {
    document.getElementById('signin-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const messageDiv = document.getElementById('message');

        try {
            const response = await fetch('/api/signin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
                setCurrentUser(data.user, data.token);
                window.location.href = 'index.html';
            } else {
                messageDiv.textContent = data.error;
                messageDiv.style.color = 'red';
            }
        } catch (error) {
            messageDiv.textContent = 'An error occurred. Please try again.';
            messageDiv.style.color = 'red';
        }
    });
}

// Check if user is logged in on main page
if (window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/')) {
    if (!getCurrentUser() || !getToken()) {
        window.location.href = 'signin.html';
    }
}