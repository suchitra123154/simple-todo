document.addEventListener('DOMContentLoaded', function() {
    const taskInput = document.getElementById('task-input');
    const addBtn = document.getElementById('add-btn');
    const taskList = document.getElementById('task-list');
    const logoutBtn = document.getElementById('logout-btn');

    // Load tasks from API
    loadTasks();

    // Add task event listener
    addBtn.addEventListener('click', addTask);
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addTask();
        }
    });

    // Logout event listener
    logoutBtn.addEventListener('click', logout);

    async function loadTasks() {
        if (!getToken()) {
            return; // Don't load tasks if not authenticated
        }

        try {
            const response = await fetch('/api/tasks', {
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            const tasks = await response.json();
            tasks.forEach(task => {
                const taskItem = createTaskElement(task);
                taskList.appendChild(taskItem);
            });
        } catch (error) {
            console.error('Error loading tasks:', error);
        }
    }

    async function addTask() {
        const taskText = taskInput.value.trim();
        if (taskText === '') return;

        // Check if user is authenticated
        if (!getToken()) {
            const message = document.getElementById('message');
            message.textContent = 'Please sign in to add tasks.';
            message.style.color = 'red';
            setTimeout(() => {
                message.textContent = '';
                window.location.href = 'signin.html';
            }, 3000);
            return;
        }

        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ text: taskText })
            });
            const newTask = await response.json();
            const taskItem = createTaskElement(newTask);
            taskList.appendChild(taskItem);
            taskInput.value = '';
            // Show success message
            const message = document.getElementById('message');
            message.textContent = `Task "${taskText}" added successfully!`;
            message.style.color = 'green';
            setTimeout(() => {
                message.textContent = '';
            }, 3000);
        } catch (error) {
            console.error('Error adding task:', error);
            // Optionally show error message
            const message = document.getElementById('message');
            message.textContent = 'Error adding task. Please try again.';
            message.style.color = 'red';
            setTimeout(() => {
                message.textContent = '';
            }, 3000);
        }
    }

    function createTaskElement(task) {
        const li = document.createElement('li');
        li.className = 'task-item';
        li.dataset.id = task.id;
        li.dataset.text = task.text;

        const span = document.createElement('span');
        span.className = 'task-text';
        span.textContent = task.text;
        if (task.completed) {
            span.classList.add('completed');
        }

        const completeBtn = document.createElement('button');
        completeBtn.className = 'complete-btn';
        completeBtn.textContent = task.completed ? 'Undo' : 'Complete';
        completeBtn.addEventListener('click', function() {
            toggleComplete(task.id, span, completeBtn);
        });

        const editBtn = document.createElement('button');
        editBtn.className = 'edit-btn';
        editBtn.textContent = 'Edit';
        editBtn.addEventListener('click', function() {
            editTask(li, span, editBtn, completeBtn, deleteBtn);
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = 'Delete';
        deleteBtn.addEventListener('click', function() {
            deleteTask(task.id, li);
        });

        li.appendChild(span);
        li.appendChild(completeBtn);
        li.appendChild(editBtn);
        li.appendChild(deleteBtn);

        return li;
    }

    async function toggleComplete(taskId, span, btn) {
        const isCompleted = span.classList.contains('completed');
        span.classList.toggle('completed');
        btn.textContent = isCompleted ? 'Complete' : 'Undo';

        try {
            await fetch(`/api/tasks/${taskId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                body: JSON.stringify({ text: span.textContent, completed: !isCompleted })
            });
        } catch (error) {
            console.error('Error updating task:', error);
        }
    }

    async function deleteTask(taskId, li) {
        try {
            await fetch(`/api/tasks/${taskId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getToken()}` }
            });
            li.remove();
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    }

    function editTask(li, span, editBtn, completeBtn, deleteBtn) {
        const taskId = li.dataset.id;
        const originalText = li.dataset.text;
        // Hide span and buttons
        span.style.display = 'none';
        completeBtn.style.display = 'none';
        editBtn.style.display = 'none';
        deleteBtn.style.display = 'none';

        // Create input
        const input = document.createElement('input');
        input.type = 'text';
        input.value = originalText;
        input.className = 'edit-input';

        // Create save button
        const saveBtn = document.createElement('button');
        saveBtn.className = 'save-btn';
        saveBtn.textContent = 'Save';
        saveBtn.addEventListener('click', async function() {
            const newText = input.value.trim();
            if (newText !== '' && newText !== originalText) {
                span.textContent = newText;
                li.dataset.text = newText;
                try {
                    await fetch(`/api/tasks/${taskId}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${getToken()}`
                        },
                        body: JSON.stringify({ text: newText, completed: span.classList.contains('completed') })
                    });
                } catch (error) {
                    console.error('Error updating task:', error);
                }
            }
            exitEditMode(li, span, input, saveBtn, cancelBtn, completeBtn, editBtn, deleteBtn);
        });

        // Create cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'cancel-btn';
        cancelBtn.textContent = 'Cancel';
        cancelBtn.addEventListener('click', function() {
            exitEditMode(li, span, input, saveBtn, cancelBtn, completeBtn, editBtn, deleteBtn);
        });

        // Append input and buttons
        li.insertBefore(input, completeBtn);
        li.appendChild(saveBtn);
        li.appendChild(cancelBtn);

        input.focus();
        input.select();
    }

    function exitEditMode(li, span, input, saveBtn, cancelBtn, completeBtn, editBtn, deleteBtn) {
        // Remove input and edit buttons
        li.removeChild(input);
        li.removeChild(saveBtn);
        li.removeChild(cancelBtn);

        // Show original elements
        span.style.display = '';
        completeBtn.style.display = '';
        editBtn.style.display = '';
        deleteBtn.style.display = '';
    }
});