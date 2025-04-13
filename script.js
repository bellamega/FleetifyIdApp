// DOM Elements
const titleInput = document.getElementById('title-input');
const descInput = document.getElementById('desc-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const taskCount = document.getElementById('task-count');
const filterBtns = document.querySelectorAll('.filter-btn');
const toggleBtn = document.getElementById('toggle-mode');
const toggleIcon = document.getElementById('toggle-icon');

// Theme Management
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
    document.documentElement.classList.add('dark');
    toggleIcon.textContent = '☀️';
  } else {
    document.documentElement.classList.remove('dark');
    toggleIcon.textContent = '🌙';
  }
}

function toggleTheme() {
  const isDark = document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
  toggleIcon.textContent = isDark ? '☀️' : '🌙';
}

// Task Management
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';
let draggedItemId = null;

function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function renderTasks() {
  taskList.innerHTML = '';
  
  const filteredTasks = tasks.filter(task => {
    if (currentFilter === 'completed') return task.completed;
    if (currentFilter === 'pending') return !task.completed;
    return true;
  });

  if (filteredTasks.length === 0) {
    taskList.innerHTML = '<li class="text-center py-4 text-gray-500">No tasks found</li>';
    taskCount.textContent = '0';
    return;
  }

  filteredTasks.forEach((task, index) => {
    const taskItem = document.createElement('li');
    taskItem.className = `task-item p-4 rounded-lg shadow border ${
      task.completed 
        ? 'bg-green-100 border-green-500 dark:bg-green-800' 
        : 'bg-red-100 border-red-500 dark:bg-red-800'
    } ${task.completed ? 'opacity-70 line-through' : ''}`;
    
    taskItem.setAttribute('draggable', 'true');
    taskItem.dataset.id = index;
    
    taskItem.innerHTML = `
      <div class="flex justify-between items-start">
        <div class="flex-1">
          <h3 class="font-medium break-words">${task.title}</h3>
          ${task.description ? `<p class="text-sm text-gray-700 dark:text-gray-200 mt-1 break-words">${task.description}</p>` : ''}
        </div>
        <div class="flex space-x-2 ml-3">
          <button class="p-1 hover:text-green-600" onclick="toggleComplete(${index})">✅</button>
          <button class="p-1 hover:text-yellow-500" onclick="editTask(${index})">✏️</button>
          <button class="p-1 hover:text-red-600" onclick="deleteTask(${index})">🗑️</button>
        </div>
      </div>
    `;

    taskItem.addEventListener('dragstart', dragStart);
    taskItem.addEventListener('dragend', dragEnd);
    taskList.appendChild(taskItem);
  });

  taskCount.textContent = tasks.length;
}

function addTask() {
  const title = titleInput.value.trim();
  if (!title) return;

  const description = descInput.value.trim();
  tasks.push({ title, description, completed: false });

  titleInput.value = '';
  descInput.value = '';

  saveTasks();
  renderTasks();
  titleInput.focus();
}

function deleteTask(index) {
  if (confirm('Are you sure you want to delete this task?')) {
    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
  }
}

function toggleComplete(index) {
  tasks[index].completed = !tasks[index].completed;
  saveTasks();
  renderTasks();
}

function editTask(index) {
  const task = tasks[index];
  const newTitle = prompt('Edit title:', task.title);
  if (newTitle === null) return;
  const newDesc = prompt('Edit description:', task.description);
  if (newDesc === null) return;

  tasks[index].title = newTitle.trim() || task.title;
  tasks[index].description = newDesc.trim() || task.description;

  saveTasks();
  renderTasks();
}

// Drag and drop
function dragStart(e) {
  draggedItemId = e.target.dataset.id;
  e.target.classList.add('dragging');
  e.dataTransfer.setData('text/plain', draggedItemId);
  e.dataTransfer.effectAllowed = 'move';
}

function dragEnd(e) {
  e.target.classList.remove('dragging');
}

function dragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';

  const draggingElement = document.querySelector('.dragging');
  const afterElement = getDragAfterElement(e.clientY);

  if (afterElement == null) {
    taskList.appendChild(draggingElement);
  } else {
    taskList.insertBefore(draggingElement, afterElement);
  }
}

function getDragAfterElement(y) {
  const draggableElements = [...document.querySelectorAll('.task-item:not(.dragging)')];

  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;

    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function drop(e) {
  e.preventDefault();
  if (!draggedItemId) return;

  const afterElement = getDragAfterElement(e.clientY);
  const draggedTask = tasks[draggedItemId];
  tasks.splice(draggedItemId, 1);

  let newIndex;
  if (afterElement == null) {
    newIndex = tasks.length;
  } else {
    newIndex = tasks.findIndex(task => task === tasks[afterElement.dataset.id]);
  }

  tasks.splice(newIndex, 0, draggedTask);
  saveTasks();
  renderTasks();
  draggedItemId = null;
}

// Event Listeners
addBtn.addEventListener('click', addTask);
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    currentFilter = btn.dataset.filter;
    renderTasks();
  });
});

toggleBtn.addEventListener('click', toggleTheme);
taskList.addEventListener('dragover', dragOver);
taskList.addEventListener('drop', drop);



// Init
initTheme();
renderTasks();