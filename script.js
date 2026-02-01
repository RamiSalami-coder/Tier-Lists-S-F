const tiers = ["S","A","B","C","D","F"];
let draggedItem = null;
let currentEditingId = null;

const homeScreen = document.getElementById("homeScreen");
const editorScreen = document.getElementById("editorScreen");
const tierGrid = document.getElementById("tierGrid");
const tierList = document.getElementById("tierList");

document.getElementById("addTierBtn").onclick = () => openEditor();

function goHome() {
  editorScreen.style.display = "none";
  homeScreen.style.display = "block";
  loadHome();
}

function loadHome() {
  tierGrid.innerHTML = "";
  const saved = JSON.parse(localStorage.getItem("tierLists") || "[]");

  saved.forEach(tier => {
    const card = document.createElement("div");
    card.className = "tier-card";
    card.textContent = tier.name;
    card.onclick = () => openEditor(tier.id);

    const delBtn = document.createElement("button");
    delBtn.className = "delete-tier-btn";
    delBtn.textContent = "×";
    delBtn.onclick = (e) => { e.stopPropagation(); deleteTierList(tier.id); };

    const shareBtn = document.createElement("button");
    shareBtn.className = "share-tier-btn";
    shareBtn.textContent = "📎";
    shareBtn.onclick = (e) => { e.stopPropagation(); shareTier(tier); };

    card.appendChild(delBtn);
    card.appendChild(shareBtn);
    tierGrid.appendChild(card);
  });
}

function deleteTierList(id) {
  let saved = JSON.parse(localStorage.getItem("tierLists") || "[]");
  saved = saved.filter(t => t.id !== id);
  localStorage.setItem("tierLists", JSON.stringify(saved));
  loadHome();
}

function openEditor(id = null) {
  homeScreen.style.display = "none";
  editorScreen.style.display = "flex";
  document.getElementById("tierNameInput").value = "";
  tierList.innerHTML = "";
  currentEditingId = id || Date.now();
  createTiers();
  if (id) loadTierList(id);
}

function createTiers() {
  tiers.forEach(tier => {
    const row = document.createElement("div");
    row.className = "tier-row";

    const label = document.createElement("div");
    label.className = "tier-label " + tier;
    label.textContent = tier;

    const items = document.createElement("div");
    items.className = "tier-items";
    items.dataset.tier = tier;
    addDropEvents(items);

    row.appendChild(label);
    row.appendChild(items);
    tierList.appendChild(row);
  });
}

function createItem(src, tier = "F") {
  const div = document.createElement("div");
  div.className = "item";
  div.draggable = true;

  const img = document.createElement("img");
  img.src = src;

  const del = document.createElement("button");
  del.className = "delete-btn";
  del.textContent = "×";
  del.onclick = () => div.remove();

  div.appendChild(img);
  div.appendChild(del);

  div.addEventListener("dragstart", () => {
    draggedItem = div;
    setTimeout(() => div.style.display = "none", 0);
  });

  div.addEventListener("dragend", () => {
    draggedItem = null;
    div.style.display = "block";
  });

  document.querySelector(`[data-tier="${tier}"]`).appendChild(div);
}

document.getElementById("imageUpload").addEventListener("change", e => {
  [...e.target.files].forEach(file => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = ev => createItem(ev.target.result);
    reader.readAsDataURL(file);
  });
});

document.addEventListener("paste", e => {
  [...e.clipboardData.items].forEach(item => {
    if (item.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = ev => createItem(ev.target.result);
      reader.readAsDataURL(item.getAsFile());
    }
  });
});

function addDropEvents(container) {
  container.addEventListener("dragover", e => e.preventDefault());
  container.addEventListener("drop", e => {
    e.preventDefault();
    if (draggedItem) container.appendChild(draggedItem);
  });
}

function saveTierList() {
  const name = document.getElementById("tierNameInput").value.trim() || "Untitled Tier";
  const data = [];

  document.querySelectorAll(".tier-items").forEach(tierDiv => {
    const tier = tierDiv.dataset.tier;
    tierDiv.querySelectorAll("img").forEach(img => {
      data.push({ src: img.src, tier });
    });
  });

  const saved = JSON.parse(localStorage.getItem("tierLists") || "[]");
  const index = saved.findIndex(t => t.id === currentEditingId);
  const tierObj = { id: currentEditingId, name, items: data };

  if (index >= 0) saved[index] = tierObj;
  else saved.push(tierObj);

  localStorage.setItem("tierLists", JSON.stringify(saved));
  goHome();
}

function loadTierList(id) {
  const saved = JSON.parse(localStorage.getItem("tierLists") || "[]");
  const tier = saved.find(t => t.id === id);
  if (!tier) return;
  document.getElementById("tierNameInput").value = tier.name;
  tier.items.forEach(item => createItem(item.src, item.tier));
}

function shareTier(tier) {
  const dataStr = btoa(JSON.stringify(tier));
  const url = `${window.location.href.split("?")[0]}?tier=${dataStr}`;
  navigator.clipboard.writeText(url).then(() => alert("Share link copied!"));
}

document.getElementById("importLinkBtn").onclick = () => {
  const link = prompt("Paste tier link here:");
  if (!link) return;
  try {
    const url = new URL(link);
    const dataStr = url.searchParams.get("tier");
    const tier = JSON.parse(atob(dataStr));
    tier.id = Date.now();
    const saved = JSON.parse(localStorage.getItem("tierLists") || "[]");
    saved.push(tier);
    localStorage.setItem("tierLists", JSON.stringify(saved));
    loadHome();
  } catch {
    alert("Invalid tier link!");
  }
};

loadHome();
