// ============================================
// LEAFGPT 🍃
// Supabase + Gemini + historia rozmów
// ============================================


// ============================================
// SUPABASE
// ============================================

const SUPABASE_URL =
  "https://pmshdzafuaadxbkzzvdj.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_yWRdbcIpWXniK9fe31KchQ_3T0zGdpb";


const db = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);


// ============================================
// BACKEND LEAFGPT
// ============================================

const LEAFGPT_API =
  "https://leaf-gpt.vercel.app/api/chat";


// ============================================
// ELEMENTY
// ============================================

const form =
  document.getElementById("chatForm");

const input =
  document.getElementById("messageInput");

const chat =
  document.getElementById("chat");

const welcome =
  document.getElementById("welcome");


const countEl =
  document.getElementById("messageCount");

const progress =
  document.getElementById("progressBar");


const historyList =
  document.getElementById("historyList");

const newChatButton =
  document.getElementById("newChatButton");

const newChatIcon =
  document.getElementById("newChatIcon");


const accountButton =
  document.getElementById("accountButton");

const accountName =
  document.getElementById("accountName");

const accountStatus =
  document.getElementById("accountStatus");


const authOverlay =
  document.getElementById("authOverlay");

const authClose =
  document.getElementById("authClose");

const authForm =
  document.getElementById("authForm");

const authEmail =
  document.getElementById("authEmail");

const authPassword =
  document.getElementById("authPassword");

const authTitle =
  document.getElementById("authTitle");

const authSubmit =
  document.getElementById("authSubmit");

const authSwitch =
  document.getElementById("authSwitch");

const authMessage =
  document.getElementById("authMessage");

const logoutButton =
  document.getElementById("logoutButton");


// ============================================
// STAN APLIKACJI
// ============================================

let currentUser = null;

let currentChatId = null;

let messages = [];

let generating = false;

let mode = "login";

let count = 0;


// ============================================
// TEXTAREA
// ============================================

input.addEventListener(
  "input",
  () => {

    input.style.height = "auto";

    input.style.height =
      Math.min(
        input.scrollHeight,
        140
      ) + "px";
  }
);


input.addEventListener(
  "keydown",
  (event) => {

    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {

      event.preventDefault();

      if (!generating) {
        form.requestSubmit();
      }
    }
  }
);


// ============================================
// NOWY CZAT
// ============================================

newChatButton.addEventListener(
  "click",
  startNewChat
);


newChatIcon.addEventListener(
  "click",
  startNewChat
);


function startNewChat() {

  currentChatId = null;

  messages = [];

  chat.innerHTML = "";

  welcome.style.display = "";

  input.value = "";

  input.focus();
}


// ============================================
// WYSŁANIE WIADOMOŚCI
// ============================================

form.addEventListener(
  "submit",
  async (event) => {

    event.preventDefault();

    if (generating) {
      return;
    }


    const text =
      input.value.trim();


    if (!text) {
      return;
    }


    welcome.style.display = "none";


    // ========================================
    // UTWÓRZ CZAT PRZY PIERWSZEJ WIADOMOŚCI
    // ========================================

    if (
      currentUser &&
      !currentChatId
    ) {

      const title =
        createChatTitle(text);


      const {
        data,
        error
      } =
        await db
          .from("chats")
          .insert({
            user_id:
              currentUser.id,

            title:
              title
          })
          .select()
          .single();


      if (error) {

        console.error(
          "Błąd tworzenia czatu:",
          error
        );

      } else {

        currentChatId =
          data.id;

        await loadChats();
      }
    }


    // ========================================
    // POKAŻ WIADOMOŚĆ
    // ========================================

    addMessage(
      text,
      "user"
    );


    messages.push({
      role: "user",
      content: text
    });


    // ========================================
    // ZAPIS WIADOMOŚCI UŻYTKOWNIKA
    // ========================================

    if (
      currentUser &&
      currentChatId
    ) {

      await saveMessage(
        "user",
        text
      );
    }


    // ========================================
    // LICZNIK DRZEWA
    // ========================================

    count++;

    if (count >= 100) {

      count = 0;

      console.log(
        "🌳 100 wiadomości!"
      );
    }


    countEl.textContent =
      count;

    progress.style.width =
      count + "%";


    // ========================================
    // WYCZYŚĆ INPUT
    // ========================================

    input.value = "";

    input.style.height =
      "auto";


    generating = true;


    // ========================================
    // MYŚLENIE
    // ========================================

    const thinking =
      document.createElement(
        "div"
      );


    thinking.className =
      "message bot thinking";


    thinking.textContent =
      "LeafGPT myśli... 🍃";


    chat.appendChild(
      thinking
    );


    chat.scrollTop =
      chat.scrollHeight;


    // ========================================
    // GEMINI
    // ========================================

    try {

      const response =
        await fetch(
          LEAFGPT_API,
          {

            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json"
            },

            body:
              JSON.stringify({
                messages:
                  messages
              })
          }
        );


      const data =
        await response.json();


      thinking.remove();


      if (!response.ok) {

        console.error(
          data
        );


        addMessage(
          data.error ||
          "Wystąpił błąd LeafGPT.",
          "bot"
        );


        generating =
          false;

        return;
      }


      const reply =
        data.reply ||
        "Nie udało mi się wygenerować odpowiedzi.";


      // ========================================
      // POKAŻ ODPOWIEDŹ
      // ========================================

      addMessage(
        reply,
        "bot"
      );


      messages.push({
        role:
          "assistant",

        content:
          reply
      });


      // ========================================
      // ZAPIS ODPOWIEDZI AI
      // ========================================

      if (
        currentUser &&
        currentChatId
      ) {

        await saveMessage(
          "assistant",
          reply
        );


        await loadChats();
      }

    } catch (error) {

      console.error(
        "LeafGPT:",
        error
      );


      thinking.remove();


      addMessage(
        "Nie udało się połączyć z serwerem LeafGPT.",
        "bot"
      );
    }


    generating =
      false;
  }
);


// ============================================
// TYTUŁ CZATU
// ============================================

function createChatTitle(text) {

  let title =
    text
      .replace(/\s+/g, " ")
      .trim();


  if (
    title.length > 34
  ) {

    title =
      title.substring(
        0,
        34
      ) + "…";
  }


  return title ||
    "Nowy czat";
}


// ============================================
// WYŚWIETLANIE WIADOMOŚCI
// ============================================

function addMessage(
  text,
  type
) {

  const element =
    document.createElement(
      "div"
    );


  element.className =
    "message " + type;


  element.textContent =
    text;


  chat.appendChild(
    element
  );


  chat.scrollTop =
    chat.scrollHeight;
}


// ============================================
// ZAPIS WIADOMOŚCI
// ============================================

async function saveMessage(
  role,
  content
) {

  if (
    !currentUser ||
    !currentChatId
  ) {

    return;
  }


  const {
    error
  } =
    await db
      .from("messages")
      .insert({

        chat_id:
          currentChatId,

        user_id:
          currentUser.id,

        role:
          role,

        content:
          content
      });


  if (error) {

    console.error(
      "Błąd zapisu wiadomości:",
      error
    );
  }
}


// ============================================
// WCZYTYWANIE LISTY CZATÓW
// ============================================

async function loadChats() {

  historyList.innerHTML =
    "";


  if (!currentUser) {
    return;
  }


  const {
    data,
    error
  } =
    await db
      .from("chats")
      .select(
        "id,title,created_at,updated_at"
      )
      .eq(
        "user_id",
        currentUser.id
      )
      .order(
        "updated_at",
        {
          ascending:
            false
        }
      );


  if (error) {

    console.error(
      "Błąd pobierania czatów:",
      error
    );

    return;
  }


  for (
    const item of data
  ) {

    const button =
      document.createElement(
        "button"
      );


    button.type =
      "button";


    button.dataset.chatId =
      item.id;


    const icon =
      document.createElement(
        "span"
      );


    icon.textContent =
      "○";


    const title =
      document.createElement(
        "span"
      );


    title.textContent =
      item.title;


    button.append(
      icon,
      title
    );


    if (
      item.id ===
      currentChatId
    ) {

      button.classList.add(
        "active-chat"
      );
    }


    button.addEventListener(
      "click",
      () => {

        openChat(
          item.id
        );
      }
    );


    historyList.appendChild(
      button
    );
  }
}


// ============================================
// OTWIERANIE CZATU
// ============================================

async function openChat(
  chatId
) {

  if (
    !currentUser ||
    generating
  ) {

    return;
  }


  currentChatId =
    chatId;


  chat.innerHTML =
    "";


  messages =
    [];


  welcome.style.display =
    "none";


  const {
    data,
    error
  } =
    await db
      .from("messages")
      .select(
        "role,content,created_at"
      )
      .eq(
        "chat_id",
        chatId
      )
      .eq(
        "user_id",
        currentUser.id
      )
      .order(
        "created_at",
        {
          ascending:
            true
        }
      );


  if (error) {

    console.error(
      "Błąd pobierania wiadomości:",
      error
    );

    return;
  }


  for (
    const message of data
  ) {

    messages.push({
      role:
        message.role,

      content:
        message.content
    });


    addMessage(
      message.content,

      message.role ===
        "assistant"
        ? "bot"
        : "user"
    );
  }


  await loadChats();
}


// ============================================
// KONTO
// ============================================

accountButton.onclick =
  () => {

    authOverlay
      .classList
      .remove(
        "hidden"
      );

    renderModal();
  };


authClose.onclick =
  () => {

    authOverlay
      .classList
      .add(
        "hidden"
      );
  };


authOverlay.onclick =
  (event) => {

    if (
      event.target ===
      authOverlay
    ) {

      authOverlay
        .classList
        .add(
          "hidden"
        );
    }
  };


// ============================================
// LOGIN / REGISTER
// ============================================

authSwitch.onclick =
  () => {

    mode =
      mode === "login"
        ? "register"
        : "login";


    authMessage.textContent =
      "";


    renderModal();
  };


// ============================================
// MODAL
// ============================================

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


  if (
    mode === "login"
  ) {

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


// ============================================
// LOGOWANIE / REJESTRACJA
// ============================================

authForm.onsubmit =
  async (event) => {

    event.preventDefault();


    authMessage.textContent =
      "";


    authSubmit.disabled =
      true;


    const email =
      authEmail
        .value
        .trim();


    const password =
      authPassword
        .value;


    let result;


    if (
      mode ===
      "register"
    ) {

      result =
        await db.auth.signUp({
          email,
          password
        });

    } else {

      result =
        await db.auth
          .signInWithPassword({
            email,
            password
          });
    }


    authSubmit.disabled =
      false;


    if (
      result.error
    ) {

      authMessage.textContent =
        result.error.message;


      renderModal();

      return;
    }


    if (
      mode ===
        "register" &&
      !result.data.session
    ) {

      authMessage.style.color =
        "#75ce80";


      authMessage.textContent =
        "Konto utworzone. Sprawdź e-mail i potwierdź rejestrację.";

    } else {

      authOverlay
        .classList
        .add(
          "hidden"
        );
    }


    renderModal();
  };


// ============================================
// WYLOGOWANIE
// ============================================

logoutButton.onclick =
  async () => {

    await db.auth
      .signOut();


    currentChatId =
      null;


    messages =
      [];


    chat.innerHTML =
      "";


    historyList.innerHTML =
      "";


    welcome.style.display =
      "";


    authOverlay
      .classList
      .add(
        "hidden"
      );
  };


// ============================================
// UŻYTKOWNIK
// ============================================

async function renderUser(
  user
) {

  currentUser =
    user;


  if (user) {

    accountName.textContent =
      user.email
        ?.split("@")[0] ||
      "Użytkownik";


    accountStatus.textContent =
      user.email ||
      "Zalogowano";


    await loadChats();

  } else {

    accountName.textContent =
      "Użytkownik";


    accountStatus.textContent =
      "Zaloguj się, aby zapisywać rozmowy";


    historyList.innerHTML =
      "";
  }


  renderModal();
}


// ============================================
// SESJA SUPABASE
// ============================================

db.auth
  .getUser()
  .then(
    ({ data }) => {

      renderUser(
        data.user
      );
    }
  );


db.auth
  .onAuthStateChange(
    (_event, session) => {

      renderUser(
        session?.user ??
        null
      );
    }
  );
