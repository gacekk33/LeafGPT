const SUPABASE_URL = "https://pmshdzafuaadxbkzzvdj.supabase.co";
const SUPABASE_KEY = "sb_publishable_yWRdbcIpWXniK9fe31KchQ_3T0zGdpb";

const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// ================================
// ELEMENTY STRONY
// ================================

const form = document.getElementById("chatForm");
const input = document.getElementById("messageInput");
const chat = document.getElementById("chat");
const welcome = document.getElementById("welcome");

const countEl = document.getElementById("messageCount");
const progress = document.getElementById("progressBar");

const accountButton = document.getElementById("accountButton");
const accountName = document.getElementById("accountName");
const accountStatus = document.getElementById("accountStatus");

const authOverlay = document.getElementById("authOverlay");
const authClose = document.getElementById("authClose");
const authForm = document.getElementById("authForm");
const authEmail = document.getElementById("authEmail");
const authPassword = document.getElementById("authPassword");

const authTitle = document.getElementById("authTitle");
const authSubmit = document.getElementById("authSubmit");
const authSwitch = document.getElementById("authSwitch");
const authMessage = document.getElementById("authMessage");

const logoutButton = document.getElementById("logoutButton");

// ================================
// ZMIENNE
// ================================

let count = 0;
let mode = "login";
let currentUser = null;
let generating = false;

// Historia aktualnej rozmowy wysyłana do Gemini
let messages = [];

// ================================
// TEXTAREA
// ================================

input.addEventListener("input", () => {
  input.style.height = "auto";

  input.style.height =
    Math.min(input.scrollHeight, 140) + "px";
});

input.addEventListener("keydown", (e) => {
  if (
    e.key === "Enter" &&
    !e.shiftKey
  ) {
    e.preventDefault();

    if (!generating) {
      form.requestSubmit();
    }
  }
});

// ================================
// WYSYŁANIE WIADOMOŚCI
// ================================

form.addEventListener("submit", async (e) => {

  e.preventDefault();

  if (generating) return;

  const text = input.value.trim();

  if (!text) return;

  welcome.style.display = "none";

  // Dodaj wiadomość użytkownika
  addMessage(text, "user");

  messages.push({
    role: "user",
    content: text
  });

  // ================================
  // LICZNIK DRZEWA
  // ================================

  count++;

  if (count >= 100) {
    count = 0;

    console.log(
      "🌳 Osiągnięto 100 wiadomości!"
    );
  }

  countEl.textContent = count;
  progress.style.width = count + "%";

  // Wyczyść pole
  input.value = "";
  input.style.height = "auto";

  generating = true;

  // ================================
  // ANIMACJA "MYŚLENIA"
  // ================================

  const thinking = document.createElement("div");

  thinking.className = "message bot thinking";
  thinking.textContent = "LeafGPT myśli... 🍃";

  chat.appendChild(thinking);

  chat.scrollTop = chat.scrollHeight;

  try {

    // ================================
    // API LEAFGPT
    // ================================

    const response = await fetch(
      "/api/chat",
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json"
        },

        body: JSON.stringify({
          messages: messages
        })
      }
    );

    const data = await response.json();

    thinking.remove();

    if (!response.ok) {

      console.error(
        "LeafGPT API:",
        data
      );

      addMessage(
        data.error ||
        "Wystąpił błąd podczas generowania odpowiedzi.",
        "bot"
      );

      generating = false;
      return;
    }

    // ================================
    // ODPOWIEDŹ GEMINI
    // ================================

    const reply =
      data.reply ||
      "Nie udało mi się wygenerować odpowiedzi.";

    addMessage(
      reply,
      "bot"
    );

    // Dodaj odpowiedź do kontekstu
    messages.push({
      role: "assistant",
      content: reply
    });

  } catch (error) {

    console.error(error);

    thinking.remove();

    addMessage(
      "Nie udało się połączyć z serwerem LeafGPT.",
      "bot"
    );

  }

  generating = false;
});

// ================================
// DODAWANIE WIADOMOŚCI
// ================================

function addMessage(text, type) {

  const element =
    document.createElement("div");

  element.className =
    "message " + type;

  element.textContent = text;

  chat.appendChild(element);

  chat.scrollTop =
    chat.scrollHeight;
}

// ================================
// KONTO
// ================================

accountButton.onclick = () => {

  authOverlay.classList.remove(
    "hidden"
  );

  renderModal();
};

authClose.onclick = () => {

  authOverlay.classList.add(
    "hidden"
  );
};

authOverlay.onclick = (e) => {

  if (e.target === authOverlay) {

    authOverlay.classList.add(
      "hidden"
    );
  }
};

// ================================
// LOGIN / REGISTER SWITCH
// ================================

authSwitch.onclick = () => {

  mode =
    mode === "login"
      ? "register"
      : "login";

  authMessage.textContent = "";

  renderModal();
};

// ================================
// MODAL KONTA
// ================================

function renderModal() {

  if (currentUser) {

    authTitle.textContent =
      "Twoje konto";

    authForm.classList.add(
      "hidden"
    );

    authSwitch.classList.add(
      "hidden"
    );

    logoutButton.classList.remove(
      "hidden"
    );

    authMessage.style.color =
      "#75ce80";

    authMessage.textContent =
      currentUser.email || "";

    return;
  }

  authForm.classList.remove(
    "hidden"
  );

  authSwitch.classList.remove(
    "hidden"
  );

  logoutButton.classList.add(
    "hidden"
  );

  authMessage.style.color =
    "#d47a7a";

  if (mode === "login") {

    authTitle.textContent =
      "Zaloguj się";

    authSubmit.textContent =
      "Zaloguj się";

    authSwitch.textContent =
      "Nie masz konta? Zarejestruj się";

  } else {

    authTitle.textContent =
      "Utwórz konto";

    authSubmit.textContent =
      "Zarejestruj się";

    authSwitch.textContent =
      "Masz już konto? Zaloguj się";
  }
}

// ================================
// LOGOWANIE / REJESTRACJA
// ================================

authForm.onsubmit = async (e) => {

  e.preventDefault();

  authMessage.textContent = "";

  authSubmit.disabled = true;

  const email =
    authEmail.value.trim();

  const password =
    authPassword.value;

  let result;

  if (mode === "register") {

    result =
      await db.auth.signUp({
        email,
        password
      });

  } else {

    result =
      await db.auth.signInWithPassword({
        email,
        password
      });
  }

  authSubmit.disabled = false;

  if (result.error) {

    authMessage.textContent =
      result.error.message;

    renderModal();

    return;
  }

  if (
    mode === "register" &&
    !result.data.session
  ) {

    authMessage.style.color =
      "#75ce80";

    authMessage.textContent =
      "Konto utworzone. Sprawdź e-mail i potwierdź rejestrację.";

  } else {

    authOverlay.classList.add(
      "hidden"
    );
  }

  renderModal();
};

// ================================
// WYLOGOWANIE
// ================================

logoutButton.onclick = async () => {

  await db.auth.signOut();

  authOverlay.classList.add(
    "hidden"
  );
};

// ================================
// WYŚWIETLANIE UŻYTKOWNIKA
// ================================

function renderUser(user) {

  currentUser = user;

  if (user) {

    accountName.textContent =
      user.email?.split("@")[0] ||
      "Użytkownik";

    accountStatus.textContent =
      user.email ||
      "Zalogowano";

  } else {

    accountName.textContent =
      "Użytkownik";

    accountStatus.textContent =
      "Zaloguj się, aby zapisywać rozmowy";
  }

  renderModal();
}

// ================================
// WCZYTANIE SESJI SUPABASE
// ================================

db.auth
  .getUser()
  .then(({ data }) => {
    renderUser(data.user);
  });

db.auth.onAuthStateChange(
  (_event, session) => {

    renderUser(
      session?.user ?? null
    );
  }
);
