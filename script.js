const homeScreen = document.getElementById("homeScreen");
const editorScreen = document.getElementById("editorScreen");
const tierGrid = document.getElementById("tierGrid");
const tierListDiv = document.getElementById("tierList");
const tierTitleInput = document.getElementById("tierTitle");

let currentTier = null;

const tiers = ["S","A","B","C","D","F"];

function createEditorRows(data={}) {
  tierListDiv.innerHTML = "";
  tiers.forEach(t => {
    const row = document.createElement("div");
    row.className = "tier-row";

    const label = document.createElement("div");
    label.className = `tier-label ${t}`;
    label.textContent = t;

    const items = document.createElement("div");
    items.className = "tier-items";
    items.dataset.tier = t;

    (data[t] || []).forEach(src => addImageItem(src, items));

    row.appendChild(label);
    row.appendChild(items);
    tierListDiv.appendChild(row);
  });
}

function addImageItem(src, container) {
  const item = document.createElement("div");
  item.className = "item";

  const img = document.createElement("img");
  img.src = src;

  const del = document.createElement("button");
  del.textContent = "×";
  del.className = "delete-btn";
  del.onclick = () => item.remove();

  item.appendChild(img);
  item.appendChild(del);
  container.appendChild(item);
}

imageUpload.onchange = e => {
  [...e.target.files].forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => addImageItem(ev.target.result, document.querySelector(".tier-items"));
    reader.readAsDataURL(file);
  });
};

document.addEventListener("paste", e => {
  const items = e.clipboardData.items;
  for (let item of items) {
    if (item.type.startsWith("image")) {
      const file = item.getAsFile();
      const reader = new FileReader();
      reader.onload = ev => addImageItem(ev.target.result, document.querySelector(".tier-items"));
      reader.readAsDataURL(file);
    }
  }
});

function saveTier() {
  const saved = JSON.parse(localStorage.getItem("tierLists") || "[]");

  const data = {};
  document.querySelectorAll(".tier-items").forEach(div => {
    const tier = div.dataset.tier;
    data[tier] = [...div.querySelectorAll("img")].map(img => img.src);
  });

  const tierObj = {
    id: currentTier || Date.now(),
    name: tierTitleInput.value || "Untitled",
    data
  };

  const index = saved.findIndex(t => t.id === tierObj.id);
  if (index >= 0) saved[index] = tierObj;
  else saved.push(tierObj);

  localStorage.setItem("tierLists", JSON.stringify(saved));
  goHome();
}

function loadHome() {
  tierGrid.innerHTML = "";
  const saved = JSON.parse(localStorage.getItem("tierLists") || "[]");

  saved.forEach(tier => {
    const card = document.createElement("div");
    card.className = "tier-card";
    card.textContent = tier.name;
    card.onclick = () => openTier(tier);

    const del = document.createElement("button");
    del.textContent = "×";
    del.className = "delete-tier-btn";
    del.onclick = e => {
      e.stopPropagation();
      deleteTier(tier.id);
    };

    const share = document.createElement("button");
    share.textContent = "📎";
    share.className = "share-tier-btn";
    share.onclick = e => {
      e.stopPropagation();
      shareTier(tier);
    };

    card.appendChild(del);
    card.appendChild(share);
    tierGrid.appendChild(card);
  });
}

function deleteTier(id) {
  let saved = JSON.parse(localStorage.getItem("tierLists") || "[]");
  saved = saved.filter(t => t.id !== id);
  localStorage.setItem("tierLists", JSON.stringify(saved));
  loadHome();
}

function openTier(tier) {
  currentTier = tier.id;
  tierTitleInput.value = tier.name;
  createEditorRows(tier.data);
  homeScreen.style.display = "none";
  editorScreen.style.display = "flex";
}

function goHome() {
  editorScreen.style.display = "none";
  homeScreen.style.display = "block";
  loadHome();
}

function shareTier(tier) {
  const encoded = btoa(JSON.stringify(tier));
  const url = `${location.origin}${location.pathname}?tier=${encoded}`;
  navigator.clipboard.writeText(url);
  alert("Tier link copied!");
}

document.getElementById("addTierBtn").onclick = () => {
  currentTier = null;
  tierTitleInput.value = "";
  createEditorRows();
  homeScreen.style.display = "none";
  editorScreen.style.display = "flex";
};

document.getElementById("saveTierBtn").onclick = saveTier;
document.getElementById("backBtn").onclick = goHome;

document.getElementById("importLinkBtn").onclick = () => {
  const link = prompt("Paste tier link:");
  if (!link) return;
  try {
    const url = new URL(link);
    const data = JSON.parse(atob(url.searchParams.get("tier")));
    data.id = Date.now();
    const saved = JSON.parse(localStorage.getItem("tierLists") || "[]");
    saved.push(data);
    localStorage.setItem("tierLists", JSON.stringify(saved));
    loadHome();
  } catch {
    alert("Invalid link");
  }
};

loadHome();
