import { addTodo, toggleTodo, removeTodo, remaining } from './todo-model.mjs';
const load = () => JSON.parse(localStorage.getItem('todos') ?? '[]');
const store = todos => localStorage.setItem('todos', JSON.stringify(todos));
let filter = 'all';
function render() {
  const todos = load(), list = document.getElementById('list');
  list.replaceChildren();
  for (const [index, todo] of todos.entries()) {
    if (filter === 'open' && todo.done) continue;
    if (filter === 'done' && !todo.done) continue;
    const item = document.createElement('li');
    item.setAttribute('data-testid', 'todo');
    const box = document.createElement('input');
    box.type = 'checkbox'; box.id = `todo-${index}`; box.checked = todo.done;
    box.addEventListener('change', () => { store(toggleTodo(load(), index, box.checked)); render(); });
    const label = document.createElement('label');
    label.htmlFor = box.id; label.textContent = todo.title;
    const remove = document.createElement('button');
    remove.textContent = `Delete ${todo.title}`;
    remove.addEventListener('click', () => { store(removeTodo(load(), index)); render(); });
    item.append(box, label, remove); list.append(item);
  }
  document.querySelector('output').textContent = `${remaining(todos)} remaining`;
}
function add() {
  const input = document.getElementById('new-todo');
  store(addTodo(load(), input.value)); input.value = ''; render();
}
document.getElementById('add').addEventListener('click', add);
document.getElementById('new-todo').addEventListener('keydown', event => { if (event.key === 'Enter') add(); });
for (const tab of document.querySelectorAll('[role=tab]')) tab.addEventListener('click', () => {
  for (const other of document.querySelectorAll('[role=tab]')) other.setAttribute('aria-selected', String(other === tab));
  filter = tab.dataset.filter; render();
});
render();
