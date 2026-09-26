const form = document.getElementById('chatForm');
const input = document.getElementById('messageInput');
const chat = document.getElementById('chat');
const welcome = document.getElementById('welcome');
const countEl = document.getElementById('messageCount');
const progress = document.getElementById('progressBar');

let count = 0;

input.addEventListener('input', () => {
  input.style.height = 'auto';
  input.style.height = Math.min(input.scrollHeight, 140) + 'px';
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    form.requestSubmit();
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = input.value.trim();
  if (!text) return;

  welcome.style.display = 'none';
  addMessage(text, 'user');

  count = Math.min(count + 1, 100);
  countEl.textContent = count;
  progress.style.width = count + '%';

  input.value = '';
  input.style.height = 'auto';

  setTimeout(() => {
    addMessage('To na razie wersja demonstracyjna LeafGPT 🍃 — prawdziwy model AI podłączymy w kolejnym etapie.', 'bot');
  }, 450);
});

function addMessage(text, type) {
  const el = document.createElement('div');
  el.className = `message ${type}`;
  el.textContent = text;
  chat.appendChild(el);
  chat.scrollTop = chat.scrollHeight;
}
