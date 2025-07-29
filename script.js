let items = JSON.parse(localStorage.getItem("items") || "[]");
const form = document.getElementById("item-form");
const tableBody = document.querySelector("#item-table tbody");
const searchInput = document.getElementById("search");
const urlParams = new URLSearchParams(window.location.search);
const updateItemName = urlParams.get("update");

// ========== ADD / UPDATE ==========
if (form) {
  const itemInput = document.getElementById("item");
  const categoryInput = document.getElementById("category");
  const notesInput = document.getElementById("notes");

  if (updateItemName) {
    const existing = items.find(i => i.name === updateItemName);
    if (existing) {
      document.getElementById("form-title").innerHTML = `<i class="fas fa-pen"></i> Update Item`;
      itemInput.value = existing.name;
      itemInput.disabled = true;
      categoryInput.value = existing.category;
      document.getElementById("bag1").value = existing.locations.Bag1 || 0;
      document.getElementById("bag2").value = existing.locations.Bag2 || 0;
      document.getElementById("luggage").value = existing.locations.Luggage || 0;
      document.getElementById("wear").value = existing.locations.Wear || 0;
      notesInput.value = existing.notes || "";
    }
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    const name = itemInput.value.trim();
    const category = categoryInput.value;
    const notes = notesInput.value.trim();
    const locations = {
      Bag1: parseInt(document.getElementById("bag1").value) || 0,
      Bag2: parseInt(document.getElementById("bag2").value) || 0,
      Luggage: parseInt(document.getElementById("luggage").value) || 0,
      Wear: parseInt(document.getElementById("wear").value) || 0
    };

    items = items.filter(i => i.name !== name);
    items.push({ name, category, locations, notes });

    localStorage.setItem("items", JSON.stringify(items));
    window.location.href = "index.html";
  });
}

// ========== RENDER TABLE ==========
function renderTable(data) {
  if (!tableBody) return;
  const locations = ["Bag1", "Bag2", "Luggage", "Wear"];
  const grouped = {};
  data.forEach(item => {
    if (!grouped[item.category]) grouped[item.category] = [];
    grouped[item.category].push(item);
  });

  const sortedCategories = Object.keys(grouped).sort();
  const thead = document.querySelector("#item-table thead");
  thead.innerHTML = `<tr>
    <th onclick="sortBy('name')"><i class="fas fa-sort-alpha-down"></i> Item</th>
    ${locations.map(loc => `<th onclick="sortBy('${loc}')"><i class="fas fa-sort"></i> ${loc}</th>`).join("")}
    <th>Total</th>
    <th>Notes</th>
    <th>Update</th>
    <th>Remove</th>
  </tr>`;
  tableBody.innerHTML = "";

  sortedCategories.forEach((category, catIndex) => {
    const items = grouped[category].sort((a, b) => a.name.localeCompare(b.name));
    const categoryId = `category-${catIndex}`;

    const headerRow = document.createElement("tr");
    headerRow.classList.add("category-header");
    headerRow.innerHTML = `<th colspan="${locations.length + 5}" onclick="toggleCategory('${categoryId}')"><i class="fas fa-folder"></i> ${category}</th>`;
    tableBody.appendChild(headerRow);

    items.forEach(item => {
      const row = document.createElement("tr");
      row.classList.add(categoryId);
      row.style.display = "none";

      let rowHtml = `<td>${item.name}</td>`;
      let total = 0;
      locations.forEach(loc => {
        const val = item.locations[loc] || 0;
        total += val;
        let className = "";
        if (val === 1) className = "low";
        else if (val === 2) className = "medium";
        else if (val >= 3) className = "high";
        rowHtml += `<td class="${className}">${val ? (val > 1 ? val : "✔️") : ""}</td>`;
      });
      rowHtml += `<td>${total}</td>`;
      rowHtml += `<td>${item.notes || ""}</td>
        <td><button class="update-btn" onclick="editItem('${item.name}')"><i class="fas fa-pen"></i></button></td>
        <td><button class="remove-btn" onclick="removeItem('${item.name}')"><i class="fas fa-trash"></i></button></td>`;

      row.innerHTML = rowHtml;
      tableBody.appendChild(row);
    });
  });
}

function toggleCategory(catId) {
  const rows = document.querySelectorAll(`.${catId}`);
  const visible = [...rows].some(r => r.style.display !== "none");
  rows.forEach(row => {
    row.style.display = visible ? "none" : "";
  });
}

function editItem(name) {
  window.location.href = `add.html?update=${encodeURIComponent(name)}`;
}

function removeItem(name) {
  items = items.filter(i => i.name !== name);
  localStorage.setItem("items", JSON.stringify(items));
  applyFilters();
}

// ========== SEARCH ==========
if (searchInput) {
  searchInput.addEventListener("input", applyFilters);
}

function applyFilters() {
  const searchVal = searchInput ? searchInput.value.toLowerCase() : "";
  const filtered = items.filter(i =>
    !searchVal || i.name.toLowerCase().includes(searchVal)
  );
  renderTable(filtered);
}

// ========== SORTING ==========
function sortBy(key) {
  if (key === "name") {
    items.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    items.sort((a, b) => (b.locations[key] || 0) - (a.locations[key] || 0));
  }
  applyFilters();
}

// ========== EXPORT TO EXCEL ==========
function exportItems() {
  const wsData = [["Item", "Category", "Bag1", "Bag2", "Luggage", "Wear", "Total", "Notes"]];
  items.forEach(({ name, category, locations, notes }) => {
    const total = Object.values(locations).reduce((a, b) => a + (b || 0), 0);
    wsData.push([name, category, locations.Bag1 || 0, locations.Bag2 || 0, locations.Luggage || 0, locations.Wear || 0, total, notes || ""]);
  });
  const worksheet = XLSX.utils.aoa_to_sheet(wsData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Items");
  XLSX.writeFile(workbook, "item_list.xlsx");
}

// ========== EXPORT TO PDF ==========
function exportAsPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const rows = [["Item", "Category", "Bag1", "Bag2", "Luggage", "Wear", "Total", "Notes"]];

  items.forEach(({ name, category, locations, notes }) => {
    const total = Object.values(locations).reduce((a, b) => a + (b || 0), 0);
    rows.push([
      name,
      category,
      locations.Bag1 || 0,
      locations.Bag2 || 0,
      locations.Luggage || 0,
      locations.Wear || 0,
      total,
      notes || ""
    ]);
  });

  doc.autoTable({
    head: [rows[0]],
    body: rows.slice(1),
    startY: 20,
    styles: { fontSize: 8 }
  });

  doc.save("item_list.pdf");
}

// ========== IMPORT ==========
const importFile = document.getElementById("import-file");
if (importFile) {
  importFile.addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const parsed = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      items = parsed.slice(1).map(row => ({
        name: row[0],
        category: row[1],
        locations: {
          Bag1: row[2] || 0,
          Bag2: row[3] || 0,
          Luggage: row[4] || 0,
          Wear: row[5] || 0
        },
        notes: row[7] || ""
      }));

      localStorage.setItem("items", JSON.stringify(items));
      applyFilters();
      alert("✅ Import successful!");
    };
    reader.readAsArrayBuffer(file);
  });
}

// ========== TOOLS DROPDOWN ==========
function toggleDropdown() {
  const dropdown = document.getElementById("dropdown-content");
  dropdown.classList.toggle("show");

  document.addEventListener("click", function outsideClick(event) {
    if (!event.target.closest(".dropdown")) {
      dropdown.classList.remove("show");
      document.removeEventListener("click", outsideClick);
    }
  });
}

// ========== HAMBURGER MENU ==========
function toggleHamburger() {
  const nav = document.getElementById("nav-actions");
  nav.classList.toggle("show");
}

// ========== INITIALIZE ==========
if (tableBody) applyFilters();
