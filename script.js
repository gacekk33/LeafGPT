const ADMIN_UID="6226ed7c-c0b3-4d8d-afe7-1253c89b8f98";
const SUPABASE_URL="https://pmshdzafuaadxbkzzvdj.supabase.co",SUPABASE_KEY="sb_publishable_yWRdbcIpWXniK9fe31KchQ_3T0zGdpb",db=window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY),LEAFGPT_API="https://leaf-gpt.vercel.app/api/chat";
const $=id=>document.getElementById(id),form=$("chatForm"),input=$("messageInput"),chat=$("chat"),welcome=$("welcome"),countEl=$("messageCount"),progress=$("progressBar"),historyList=$("historyList"),accountButton=$("accountButton"),accountName=$("accountName"),accountStatus=$("accountStatus"),authOverlay=$("authOverlay"),authClose=$("authClose"),authForm=$("authForm"),authEmail=$("authEmail"),authPassword=$("authPassword"),authTitle=$("authTitle"),authSubmit=$("authSubmit"),authSwitch=$("authSwitch"),authMessage=$("authMessage"),logoutButton=$("logoutButton"),statsPage=$("statsPage"),statsButton=$("statsButton"),statsMessages=$("statsMessages"),statsTrees=$("statsTrees"),statsRemaining=$("statsRemaining"),statsProgressText=$("statsProgressText"),statsProgressBar=$("statsProgressBar"),impactPage=$("impactPage"),impactButton=$("impactButton"),discoverPage=$("discoverPage"),discoverButton=$("discoverButton"),surpriseButton=$("surpriseButton"),promoPage=$("promoPage"),promoButton=$("promoButton"),composerWrap=document.querySelector(".composer-wrap"),treeCounter=document.querySelector(".tree-counter");
let currentUser=null,currentChatId=null,messages=[],generating=false,mode="login",totalMessages=0,treesPlanted=0,chatsLoadVersion=0,currentView="chat";
const adminStatsZone=$("adminStatsZone"),adminRefresh=$("adminRefresh"),adminStatus=$("adminStatus");
const isAdmin=()=>currentUser?.id===ADMIN_UID;
const fmt=n=>Number(n||0).toLocaleString("pl-PL");

const settingsButton=$("settingsButton"),settingsPage=$("settingsPage"),themePicker=$("themePicker"),accentPicker=$("accentPicker"),
settingsAccountName=$("settingsAccountName"),settingsAccountEmail=$("settingsAccountEmail"),settingsLogout=$("settingsLogout");
const THEME_KEY="leafgpt_theme",ACCENT_KEY="leafgpt_accent";
let leafTheme=localStorage.getItem(THEME_KEY)||"dark",leafAccent=localStorage.getItem(ACCENT_KEY)||"green";

function applyAppearance(){
  document.documentElement.dataset.theme=leafTheme;
  document.documentElement.dataset.accent=leafAccent;
  document.querySelectorAll("[data-theme]").forEach(b=>b.classList.toggle("selected",b.dataset.theme===leafTheme));
  document.querySelectorAll("[data-accent]").forEach(b=>b.classList.toggle("selected",b.dataset.accent===leafAccent));
}
function showSettingsView(){
  currentView="settings";welcome.style.display="none";chat.classList.add("hidden");composerWrap.classList.add("hidden");treeCounter.classList.add("hidden");
  statsPage.classList.add("hidden");impactPage?.classList.add("hidden");discoverPage?.classList.add("hidden");promoPage?.classList.add("hidden");settingsPage.classList.remove("hidden");
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.remove("active"));settingsButton.classList.add("active");updateSettingsAccount();
}
function updateSettingsAccount(){
  const email=currentUser?.email||"—";
  settingsAccountEmail.textContent=email;
  settingsAccountName.textContent=currentUser?(email.split("@")[0]||"Konto LeafGPT"):"Nie zalogowano";
  settingsLogout.style.display=currentUser?"":"none";
}
settingsButton?.addEventListener("click",showSettingsView);
themePicker?.addEventListener("click",e=>{const b=e.target.closest("[data-theme]");if(!b)return;leafTheme=b.dataset.theme;localStorage.setItem(THEME_KEY,leafTheme);applyAppearance()});
accentPicker?.addEventListener("click",e=>{const b=e.target.closest("[data-accent]");if(!b)return;leafAccent=b.dataset.accent;localStorage.setItem(ACCENT_KEY,leafAccent);applyAppearance()});
settingsLogout?.addEventListener("click",()=>logoutButton?.click());
window.matchMedia("(prefers-color-scheme: dark)").addEventListener?.("change",()=>{if(leafTheme==="system")applyAppearance()});
applyAppearance();

document.addEventListener("click",e=>{
  const card=e.target.closest(".welcome-card[data-prompt]");
  if(!card)return;
  messageInput.value=card.dataset.prompt||"";
  messageInput.focus();
  messageInput.dispatchEvent(new Event("input",{bubbles:true}));
});



const historySection=$("historySection"),historyListWrap=$("historyListWrap"),historyToggle=$("historyToggle"),
chatSearchButton=$("chatSearchButton"),chatSearchPanel=$("chatSearchPanel"),chatSearchInput=$("chatSearchInput"),chatSearchClose=$("chatSearchClose"),
inChatSearch=$("inChatSearch"),inChatSearchButton=$("inChatSearchButton"),inChatSearchInput=$("inChatSearchInput"),inChatSearchClose=$("inChatSearchClose"),
inChatSearchCount=$("inChatSearchCount"),searchPrev=$("searchPrev"),searchNext=$("searchNext");
let historyCollapsed=false,chatSearchQuery="",chatSearchMatches=[],chatSearchIndex=-1;

historyToggle?.addEventListener("click",()=>{
  historyCollapsed=!historyCollapsed;
  historySection.classList.toggle("collapsed",historyCollapsed);
  historyToggle.classList.toggle("rotated",historyCollapsed);
  historyToggle.title=historyCollapsed?"Rozwiń rozmowy":"Zwiń rozmowy";
});

function openChatSearch(){
  chatSearchPanel.classList.add("open");
  requestAnimationFrame(()=>chatSearchInput.focus());
}
function closeChatSearch(){
  chatSearchPanel.classList.remove("open");
  chatSearchInput.value="";
  chatSearchQuery="";
  filterChatHistory();
}
chatSearchButton?.addEventListener("click",()=>chatSearchPanel.classList.contains("open")?closeChatSearch():openChatSearch());
chatSearchClose?.addEventListener("click",closeChatSearch);
chatSearchInput?.addEventListener("input",()=>{chatSearchQuery=chatSearchInput.value.trim().toLocaleLowerCase("pl");filterChatHistory()});
function filterChatHistory(){
  document.querySelectorAll(".history-chat").forEach(row=>{
    const title=row.querySelector(".history-chat-title")?.textContent?.toLocaleLowerCase("pl")||"";
    row.classList.toggle("search-hidden",!!chatSearchQuery&&!title.includes(chatSearchQuery));
  });
}

function openInChatSearch(){
  if(currentView!=="chat")showChatView();
  inChatSearch.classList.add("open");
  requestAnimationFrame(()=>inChatSearchInput.focus());
  runInChatSearch();
}
function closeInChatSearch(){
  inChatSearch.classList.remove("open");
  inChatSearchInput.value="";
  clearInChatSearch();
}
inChatSearchButton?.addEventListener("click",openInChatSearch);
inChatSearchClose?.addEventListener("click",closeInChatSearch);
inChatSearchInput?.addEventListener("input",runInChatSearch);
searchPrev?.addEventListener("click",()=>moveSearch(-1));
searchNext?.addEventListener("click",()=>moveSearch(1));

function clearInChatSearch(){
  chatSearchMatches=[];
  chatSearchIndex=-1;
  document.querySelectorAll("#chat .message").forEach(el=>{
    if(el.dataset.originalText!==undefined){
      el.textContent=el.dataset.originalText;
      delete el.dataset.originalText;
    }
    el.classList.remove("search-hit","search-current");
  });
  inChatSearchCount.textContent="0 / 0";
}
function runInChatSearch(){
  clearInChatSearch();
  const q=inChatSearchInput.value.trim();
  if(!q)return;
  const qLower=q.toLocaleLowerCase("pl");
  document.querySelectorAll("#chat .message").forEach(el=>{
    const original=el.textContent;
    if(original.toLocaleLowerCase("pl").includes(qLower)){
      el.dataset.originalText=original;
      el.classList.add("search-hit");
      chatSearchMatches.push(el);
    }
  });
  if(chatSearchMatches.length){chatSearchIndex=0;focusSearchMatch()}
  else inChatSearchCount.textContent="0 / 0";
}
function moveSearch(dir){
  if(!chatSearchMatches.length)return;
  chatSearchIndex=(chatSearchIndex+dir+chatSearchMatches.length)%chatSearchMatches.length;
  focusSearchMatch();
}
function focusSearchMatch(){
  chatSearchMatches.forEach((el,i)=>el.classList.toggle("search-current",i===chatSearchIndex));
  const el=chatSearchMatches[chatSearchIndex];
  el?.scrollIntoView({behavior:"smooth",block:"center"});
  inChatSearchCount.textContent=`${chatSearchIndex+1} / ${chatSearchMatches.length}`;
}
document.addEventListener("keydown",e=>{
  if(e.key==="Escape"){
    if(inChatSearch.classList.contains("open"))closeInChatSearch();
    else if(chatSearchPanel.classList.contains("open"))closeChatSearch();
  }
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==="f"&&currentView==="chat"){
    e.preventDefault();openInChatSearch();
  }
});

input.addEventListener("input",()=>{input.style.height="auto";input.style.height=Math.min(input.scrollHeight,140)+"px"});input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();if(!generating)form.requestSubmit()}});
$("newChatButton")?.addEventListener("click",()=>{showChatView();startNewChat()});$("newChatIcon")?.addEventListener("click",()=>{showChatView();startNewChat()});statsButton?.addEventListener("click",showStatsView);impactButton?.addEventListener("click",showImpactView);discoverButton?.addEventListener("click",showDiscoverView);promoButton?.addEventListener("click",showPromoView);
function showChatView(){promoPage?.classList.add("hidden");promoButton?.classList.remove("active");settingsPage?.classList.add("hidden");settingsButton?.classList.remove("active");currentView="chat";statsPage.classList.add("hidden");impactPage.classList.add("hidden");discoverPage.classList.add("hidden");chat.classList.remove("hidden");composerWrap.classList.remove("hidden");treeCounter.classList.remove("hidden");if(!messages.length)welcome.style.display="";statsButton.classList.remove("active");impactButton.classList.remove("active");discoverButton.classList.remove("active")}
function showStatsView(){promoPage?.classList.add("hidden");promoButton?.classList.remove("active");settingsPage?.classList.add("hidden");settingsButton?.classList.remove("active");currentView="stats";welcome.style.display="none";chat.classList.add("hidden");composerWrap.classList.add("hidden");treeCounter.classList.add("hidden");impactPage.classList.add("hidden");discoverPage.classList.add("hidden");statsPage.classList.remove("hidden");statsButton.classList.add("active");impactButton.classList.remove("active");discoverButton.classList.remove("active");updateCounters();toggleAdminZone();if(isAdmin())loadAdminStats()}
function showImpactView(){promoPage?.classList.add("hidden");promoButton?.classList.remove("active");settingsPage?.classList.add("hidden");settingsButton?.classList.remove("active");currentView="impact";welcome.style.display="none";chat.classList.add("hidden");composerWrap.classList.add("hidden");treeCounter.classList.add("hidden");statsPage.classList.add("hidden");discoverPage.classList.add("hidden");impactPage.classList.remove("hidden");statsButton.classList.remove("active");impactButton.classList.add("active");discoverButton.classList.remove("active")}
function showDiscoverView(){promoPage?.classList.add("hidden");promoButton?.classList.remove("active");settingsPage?.classList.add("hidden");settingsButton?.classList.remove("active");currentView="discover";welcome.style.display="none";chat.classList.add("hidden");composerWrap.classList.add("hidden");treeCounter.classList.add("hidden");statsPage.classList.add("hidden");impactPage.classList.add("hidden");discoverPage.classList.remove("hidden");statsButton.classList.remove("active");impactButton.classList.remove("active");discoverButton.classList.add("active")}
function showPromoView(){currentView="promo";welcome.style.display="none";chat.classList.add("hidden");composerWrap.classList.add("hidden");treeCounter.classList.add("hidden");statsPage.classList.add("hidden");impactPage.classList.add("hidden");discoverPage.classList.add("hidden");settingsPage?.classList.add("hidden");promoPage?.classList.remove("hidden");statsButton.classList.remove("active");impactButton.classList.remove("active");discoverButton.classList.remove("active");settingsButton?.classList.remove("active");promoButton?.classList.add("active")}
function useDiscoverPrompt(text){showChatView();startNewChat();input.value=text;input.dispatchEvent(new Event("input"));input.focus()}
document.querySelectorAll("[data-prompt]").forEach(btn=>btn.addEventListener("click",()=>useDiscoverPrompt(btn.dataset.prompt)));
const surprisePrompts=["Naucz mnie czegoś zaskakującego o kosmosie.","Opowiedz mi o technologii, która może zmienić przyszłość.","Daj mi nietypowy pomysł na kreatywny projekt.","Naucz mnie ciekawej rzeczy o samochodach w 5 minut.","Opowiedz mi o dziwnym zjawisku naukowym i wyjaśnij je prosto.","Daj mi ciekawy temat, o którym prawdopodobnie niewiele wiem."];
surpriseButton?.addEventListener("click",()=>useDiscoverPrompt(surprisePrompts[Math.floor(Math.random()*surprisePrompts.length)]));
function startNewChat(){closeInChatSearch();currentChatId=null;messages=[];chat.innerHTML="";welcome.style.display="";input.value="";markActiveChat();input.focus()}
function addMessage(text,type){const e=document.createElement("div");e.className="message "+type;e.textContent=text;chat.appendChild(e);chat.scrollTop=chat.scrollHeight}
function titleFor(t){t=t.replace(/\s+/g," ").trim();return t.length>34?t.slice(0,34)+"…":t||"Nowy czat"}
async function saveMessage(role,content){if(currentUser&&currentChatId){const{error}=await db.from("messages").insert({chat_id:currentChatId,user_id:currentUser.id,role,content});if(error)console.error(error)}}
function updateCounters(){const current=totalMessages%100;treesPlanted=Math.floor(totalMessages/100);countEl.textContent=current;progress.style.width=current+"%";statsMessages.textContent=totalMessages;statsTrees.textContent=treesPlanted;statsRemaining.textContent=current===0&&totalMessages>0?100:100-current;statsProgressText.textContent=`${current} / 100`;statsProgressBar.style.width=current+"%"}
async function loadStats(){
  if(!currentUser){
    totalMessages=0;
    treesPlanted=0;
    updateCounters();
    return;
  }

  // Źródłem prawdy są zapisane wiadomości użytkownika.
  // Dzięki temu refresh nie może wyzerować licznika.
  const {count,error:countError}=await db
    .from("messages")
    .select("id",{count:"exact",head:true})
    .eq("user_id",currentUser.id)
    .eq("role","user");

  if(countError){
    console.error("Błąd liczenia wiadomości:",countError);
    return;
  }

  totalMessages=count||0;
  treesPlanted=Math.floor(totalMessages/100);
  updateCounters();

  // user_stats zostaje jako trwałe podsumowanie konta.
  const {error:statsError}=await db.from("user_stats").upsert({
    user_id:currentUser.id,
    total_messages:totalMessages,
    trees_planted:treesPlanted,
    updated_at:new Date().toISOString()
  },{onConflict:"user_id"});

  if(statsError) console.error("Błąd synchronizacji user_stats:",statsError);
}

function toggleAdminZone(){
  adminStatsZone?.classList.toggle("hidden",!isAdmin());
}
async function loadAdminStats(){
  if(!isAdmin()) return;
  adminStatus.textContent="Pobieranie danych…";
  adminRefresh.disabled=true;
  const {data,error}=await db.rpc("leafgpt_admin_overview");
  adminRefresh.disabled=false;
  if(error){console.error("Błąd statystyk administratora:",error);adminStatus.textContent="Nie udało się pobrać statystyk. Uruchom plik supabase_admin.sql w Supabase SQL Editor.";return}
  const d=data||{};
  $("adminAccounts").textContent=fmt(d.accounts);
  $("adminChats").textContent=fmt(d.chats);
  $("adminUserMessages").textContent=fmt(d.user_messages);
  $("adminAssistantMessages").textContent=fmt(d.assistant_messages);
  $("adminAllMessages").textContent=fmt(d.all_messages);
  $("adminTrees").textContent=fmt(d.trees);
  $("adminAccountsToday").textContent=fmt(d.accounts_today);
  $("adminMessagesToday").textContent=fmt(d.user_messages_today);
  adminStatus.textContent="Dane zaktualizowane.";
}
adminRefresh?.addEventListener("click",loadAdminStats);

async function incrementStats(){
  // Wiadomość jest najpierw zapisywana w tabeli messages,
  // a następnie przeliczamy stan bez zgadywania lokalnej wartości.
  await loadStats();
}
form.addEventListener("submit",async e=>{e.preventDefault();if(generating)return;const text=input.value.trim();if(!text)return;welcome.style.display="none";if(currentUser&&!currentChatId){const{data,error}=await db.from("chats").insert({user_id:currentUser.id,title:titleFor(text)}).select().single();if(!error){currentChatId=data.id;await loadChats()}else console.error(error)}addMessage(text,"user");messages.push({role:"user",content:text});await saveMessage("user",text);await incrementStats();input.value="";generating=true;const thinking=document.createElement("div");thinking.className="message bot thinking";thinking.textContent="LeafGPT myśli... 🍃";chat.appendChild(thinking);try{const r=await fetch(LEAFGPT_API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({messages})}),d=await r.json();thinking.remove();if(!r.ok){addMessage(d.error||"Wystąpił błąd LeafGPT.","bot");generating=false;return}const reply=d.reply||"Nie udało mi się wygenerować odpowiedzi.";addMessage(reply,"bot");messages.push({role:"assistant",content:reply});await saveMessage("assistant",reply);if(currentUser)await loadChats()}catch(err){thinking.remove();addMessage("Nie udało się połączyć z serwerem LeafGPT.","bot");console.error(err)}generating=false});
async function loadChats(){const v=++chatsLoadVersion;if(!currentUser){historyList.replaceChildren();return}const uid=currentUser.id,{data,error}=await db.from("chats").select("id,title,updated_at").eq("user_id",uid).order("updated_at",{ascending:false});if(v!==chatsLoadVersion||!currentUser||currentUser.id!==uid)return;if(error)return console.error(error);const f=document.createDocumentFragment();for(const item of data||[]){const row=document.createElement("div");row.className="history-chat";row.dataset.chatId=item.id;if(item.id===currentChatId)row.classList.add("active-chat");const open=document.createElement("button");open.className="history-chat-open";open.innerHTML="<span>○</span>";const title=document.createElement("span");title.className="history-chat-title";title.textContent=item.title;open.append(title);open.onclick=()=>{showChatView();openChat(item.id)};const mb=document.createElement("button");mb.className="history-menu-button";mb.textContent="⋯";const menu=document.createElement("div");menu.className="history-menu hidden";const ren=document.createElement("button");ren.textContent="Zmień nazwę";const del=document.createElement("button");del.textContent="Usuń czat";del.className="delete-chat-button";menu.append(ren,del);mb.onclick=e=>{e.stopPropagation();menu.classList.toggle("hidden")};ren.onclick=async e=>{e.stopPropagation();const n=prompt("Nowa nazwa rozmowy:",item.title)?.trim();if(n){await db.from("chats").update({title:n.slice(0,60)}).eq("id",item.id).eq("user_id",uid);await loadChats()}};del.onclick=async e=>{e.stopPropagation();if(confirm(`Usunąć rozmowę "${item.title}"?`)){await db.from("chats").delete().eq("id",item.id).eq("user_id",uid);if(currentChatId===item.id)startNewChat();await loadChats()}};row.append(open,mb,menu);f.append(row)}historyList.replaceChildren(f);filterChatHistory()}
async function openChat(id){if(!currentUser||generating)return;closeInChatSearch();currentChatId=id;chat.innerHTML="";messages=[];welcome.style.display="none";const{data,error}=await db.from("messages").select("role,content,created_at").eq("chat_id",id).eq("user_id",currentUser.id).order("created_at",{ascending:true});if(error)return console.error(error);for(const m of data||[]){messages.push({role:m.role,content:m.content});addMessage(m.content,m.role==="assistant"?"bot":"user")}markActiveChat()}
function markActiveChat(){document.querySelectorAll(".history-chat").forEach(e=>e.classList.toggle("active-chat",e.dataset.chatId===currentChatId))}
accountButton.onclick=()=>{authOverlay.classList.remove("hidden");renderModal()};authClose.onclick=()=>authOverlay.classList.add("hidden");authSwitch.onclick=()=>{mode=mode==="login"?"register":"login";renderModal()};
function renderModal(){if(currentUser){authTitle.textContent="Twoje konto";authForm.classList.add("hidden");authSwitch.classList.add("hidden");logoutButton.classList.remove("hidden");authMessage.textContent=currentUser.email||"";return}authForm.classList.remove("hidden");authSwitch.classList.remove("hidden");logoutButton.classList.add("hidden");authTitle.textContent=mode==="login"?"Zaloguj się":"Utwórz konto";authSubmit.textContent=mode==="login"?"Zaloguj się":"Zarejestruj się";authSwitch.textContent=mode==="login"?"Nie masz konta? Zarejestruj się":"Masz już konto? Zaloguj się"}
authForm.onsubmit=async e=>{e.preventDefault();const email=authEmail.value.trim(),password=authPassword.value;authSubmit.disabled=true;const r=mode==="register"?await db.auth.signUp({email,password}):await db.auth.signInWithPassword({email,password});authSubmit.disabled=false;if(r.error){authMessage.textContent=r.error.message;return}if(mode==="register"&&!r.data.session)authMessage.textContent="Konto utworzone. Sprawdź e-mail.";else authOverlay.classList.add("hidden")};
logoutButton.onclick=async()=>{await db.auth.signOut();startNewChat();historyList.replaceChildren();authOverlay.classList.add("hidden")};
async function renderUser(u){currentUser=u;toggleAdminZone();if(u){accountName.textContent=u.email?.split("@")[0]||"Użytkownik";accountStatus.textContent=u.email||"Zalogowano";await Promise.all([loadChats(),loadStats()]);if(isAdmin()&&currentView==="stats")await loadAdminStats()}else{accountName.textContent="Użytkownik";accountStatus.textContent="Zaloguj się, aby zapisywać rozmowy";historyList.replaceChildren();totalMessages=0;treesPlanted=0;updateCounters()}renderModal()}
db.auth.onAuthStateChange((_e,s)=>renderUser(s?.user??null));updateCounters();
