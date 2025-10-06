// Team Task Tracker — script.js

// Data keys for localStorage
const LS_KEYS = { TEAM: 'tt_team', TASKS: 'tt_tasks' };

// Sample default data
const defaultTeam = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com', role: 'Developer' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com', role: 'Designer' },
  { id: 3, name: 'Carla Gomez', email: 'carla@example.com', role: 'QA' }
];

const defaultTasks = [
  { id: 1, description: 'Fix login bug', assignedTo: 1, completed: false },
  { id: 2, description: 'Design homepage', assignedTo: 2, completed: true },
  { id: 3, description: 'Write tests for auth', assignedTo: 3, completed: false }
];

// In-memory arrays (will be loaded from localStorage if present)
let teamMembers = [];
let tasks = [];

// DOM elements
const teamListEl = document.getElementById('teamList');
const taskListEl = document.getElementById('taskList');
const taskAssigneeEl = document.getElementById('taskAssignee');
const addTaskForm = document.getElementById('addTaskForm');
const addMemberForm = document.getElementById('addMemberForm');
const filterSelect = document.getElementById('filterSelect');
const clearCompletedBtn = document.getElementById('clearCompleted');

// Utility: save and load from localStorage
function saveData(){
  localStorage.setItem(LS_KEYS.TEAM, JSON.stringify(teamMembers));
  localStorage.setItem(LS_KEYS.TASKS, JSON.stringify(tasks));
}

function loadData(){
  const teamJson = localStorage.getItem(LS_KEYS.TEAM);
  const tasksJson = localStorage.getItem(LS_KEYS.TASKS);
  try{
    teamMembers = teamJson ? JSON.parse(teamJson) : defaultTeam.slice();
  }catch(e){
    teamMembers = defaultTeam.slice();
  }
  try{
    tasks = tasksJson ? JSON.parse(tasksJson) : defaultTasks.slice();
  }catch(e){
    tasks = defaultTasks.slice();
  }
}

// Helpers
function generateId(arr){
  if(!arr.length) return 1;
  return Math.max(...arr.map(i => i.id)) + 1;
}

function findMemberById(id){
  return teamMembers.find(m => m.id === Number(id));
}

// Rendering
function renderTeamMembers(){
  teamListEl.innerHTML = '';
  teamMembers.forEach(member => {
    const card = document.createElement('div');
    card.className = 'team-card';
    card.dataset.id = member.id;
    card.innerHTML = `
      <div>
        <strong>${member.name}</strong>
        <div class="meta">${member.role} • ${member.email}</div>
      </div>
      <div><small>#${member.id}</small></div>
    `;
    // Click to filter by this member
    card.addEventListener('click', () => {
      filterSelect.value = member.id;
      renderTasks(member.id);
    });
    teamListEl.appendChild(card);
  });
  populateAssigneeOptions();
  populateFilterOptions();
}

function populateAssigneeOptions(){
  taskAssigneeEl.innerHTML = '';
  teamMembers.map(m => <option value="${m.id}">${m.name} — ${m.role}</option>)
    .forEach(optStr => taskAssigneeEl.insertAdjacentHTML('beforeend', optStr));
}

function populateFilterOptions(){
  // Keep 'All' as first option
  const current = filterSelect.value || 'all';
  filterSelect.innerHTML = '<option value="all">All</option>' +
    teamMembers.map(m => <option value="${m.id}">${m.name}</option>).join('');
  filterSelect.value = current;
}

function renderTasks(filterMemberId = 'all'){
  taskListEl.innerHTML = '';
  let list = tasks.slice();
  if(filterMemberId && filterMemberId !== 'all'){
    list = list.filter(t => t.assignedTo === Number(filterMemberId));
  }
  if(!list.length){
    taskListEl.innerHTML = '<li class="task-item">No tasks to show</li>';
    return;
  }
  list.forEach(task => {
    const li = document.createElement('li');
    li.className = 'task-item' + (task.completed ? ' completed' : '');
    li.dataset.id = task.id;

    const assignee = findMemberById(task.assignedTo);
    const assigneeName = assignee ? assignee.name : 'Unassigned';

    li.innerHTML = `
      <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} />
      <div class="desc">${escapeHtml(task.description)}<div class="task-meta">Assigned to: ${escapeHtml(assigneeName)}</div></div>
      <div class="task-actions">
        <button class="toggle" title="Toggle complete">✓</button>
        <button class="delete" title="Delete">✕</button>
      </div>
    `;

    // Checkbox toggle
    const checkbox = li.querySelector('.task-checkbox');
    checkbox.addEventListener('change', () => {
      task.completed = checkbox.checked;
      saveData();
      renderTasks(filterSelect.value);
    });

    // Toggle button (same as checkbox)
    li.querySelector('.toggle').addEventListener('click', () => {
      task.completed = !task.completed;
      saveData();
      renderTasks(filterSelect.value);
    });

    // Delete button
    li.querySelector('.delete').addEventListener('click', () => {
      if(!confirm('Delete this task?')) return;
      tasks = tasks.filter(t => t.id !== task.id);
      saveData();
      renderTasks(filterSelect.value);
    });

    taskListEl.appendChild(li);
  });
}

// Simple HTML escape for user content
function escapeHtml(str){
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Event handlers
addTaskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const desc = document.getElementById('taskDesc').value.trim();
  const assignedTo = Number(document.getElementById('taskAssignee').value);
  if(!desc){ alert('Please enter a task description'); return; }
  const newTask = { id: generateId(tasks), description: desc, assignedTo, completed: false };
  tasks.push(newTask);
  saveData();
  addTaskForm.reset();
  renderTasks(filterSelect.value);
});

addMemberForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('memberName').value.trim();
  const email = document.getElementById('memberEmail').value.trim();
  const role = document.getElementById('memberRole').value.trim();
  if(!name || !email || !role){ alert('Please fill all member fields'); return; }
  const newMember = { id: generateId(teamMembers), name, email, role };
  teamMembers.push(newMember);
  saveData();
  addMemberForm.reset();
  renderTeamMembers();
  renderTasks(filterSelect.value);
});

filterSelect.addEventListener('change', (e) => {
  renderTasks(e.target.value);
});

clearCompletedBtn.addEventListener('click', () => {
  if(!confirm('Remove all completed tasks?')) return;
  tasks = tasks.filter(t => !t.completed);
  saveData();
  renderTasks(filterSelect.value);
});

// Init
window.addEventListener('DOMContentLoaded', () => {
  loadData();
  renderTeamMembers();
  renderTasks('all');
});