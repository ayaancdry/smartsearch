let isExpanded = false;
let isAddExpanded = false;

// Expands or collapses the top search box
function expandSearch() {
  let container = document.getElementById("searchContainer");
  let input = document.getElementById("searchBox");

  if (!isExpanded) {
    container.classList.add("search-expanded");
    input.style.display = "block";
    input.focus();
  } else {
    container.classList.remove("search-expanded");
    input.style.display = "none";
    document.getElementById("suggestions").style.display = "none";
  }
  isExpanded = !isExpanded;
}

// Expands or collapses the add-word box
function expandAdd() {
  let container = document.getElementById("addContainer");
  let input = document.getElementById("addBox");
  let confirmBtn = document.getElementById("confirmAdd");

  if (!isAddExpanded) {
    container.classList.add("search-expanded");
    input.style.display = "block";
    confirmBtn.style.display = "block";
    input.focus();
  } else {
    container.classList.remove("search-expanded");
    input.style.display = "none";
    confirmBtn.style.display = "none";
  }
  isAddExpanded = !isAddExpanded;
}

// Trie
let currentSuggestions = [];
let selectedSuggestionIndex = -1;

async function showSuggestions() {
  const input = document.getElementById("searchBox");
  const query = input.value.trim();
  const dropdown = document.getElementById("suggestions");
  dropdown.innerHTML = "";

  // If the user is typing something, hide the plus icon container.
  // If the user clears the search box, re-show the plus icon container.
  if (query.length > 0) {
    document.getElementById("addContainer").style.display = "none";
  } else {
    document.getElementById("addContainer").style.display = "flex";
  }

  // If query is empty, hide suggestions and return.
  if (query.length === 0) {
    dropdown.style.display = "none";
    return;
  }

  // Reset suggestion state
  currentSuggestions = [];
  selectedSuggestionIndex = -1;

  // Fetch suggestions from the server
  try {
    const response = await fetch(`/suggestions?query=${encodeURIComponent(query)}`);
    if (response.ok) {
      const suggestions = await response.json();
      currentSuggestions = suggestions;
      if (suggestions.length > 0) {
        dropdown.style.display = "block";
        // Build the dropdown <li><a> items
        suggestions.forEach((suggestion) => {
          let li = document.createElement("li");
          let a = document.createElement("a");
          a.classList.add("dropdown-item");
          a.href = "#";
          a.textContent = suggestion;
          a.onclick = (e) => {
            e.preventDefault();
            input.value = suggestion;
            dropdown.style.display = "none";
            currentSuggestions = [];
            selectedSuggestionIndex = -1;
          };
          li.appendChild(a);
          dropdown.appendChild(li);
        });
      } else {
        dropdown.style.display = "none";
      }
    } else {
      console.error("Error fetching suggestions:", response.statusText);
    }
  } catch (error) {
    console.error("Error fetching suggestions:", error);
  }
}

// Optional: Keyboard navigation with Arrow keys & Tab
document.getElementById("searchBox").addEventListener("keydown", (event) => {
  const dropdown = document.getElementById("suggestions");
  const items = dropdown.getElementsByTagName("li");

  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    if (items.length === 0) return;

    // Move selection up or down
    if (event.key === "ArrowDown") {
      selectedSuggestionIndex = (selectedSuggestionIndex + 1) % items.length;
    } else {
      selectedSuggestionIndex =
        selectedSuggestionIndex <= 0 ? items.length - 1 : selectedSuggestionIndex - 1;
    }

    // Clear prior highlight
    for (let i = 0; i < items.length; i++) {
      items[i].classList.remove("selected");
    }

    // Highlight new item
    items[selectedSuggestionIndex].classList.add("selected");

    // Also set the text in the searchBox
    document.getElementById("searchBox").value =
      items[selectedSuggestionIndex].innerText;
  } else if (event.key === "Tab") {
    // Tab to accept the first (or currently highlighted) suggestion
    if (currentSuggestions.length > 0) {
      event.preventDefault();
      if (selectedSuggestionIndex === -1) {
        selectedSuggestionIndex = 0;
      }
      document.getElementById("searchBox").value =
        currentSuggestions[selectedSuggestionIndex];
      dropdown.style.display = "none";
      currentSuggestions = [];
      selectedSuggestionIndex = -1;
    }
  }
});

/*****************************
 * Add New Word to Dictionary
 *****************************/
async function addNewWord() {
  const word = document.getElementById("addBox").value.trim().toLowerCase();
  if (!word) {
    alert("Please enter a word");
    return;
  }

  try {
    const response = await fetch(`/add-word?word=${encodeURIComponent(word)}`, {
      method: "POST",
    });
    if (response.ok) {
      const result = await response.json();
      if (result.status === "word_added") {
        alert("Word added successfully!");
        document.getElementById("addBox").value = "";

        // Collapse the add container after adding
        let container = document.getElementById("addContainer");
        let confirmBtn = document.getElementById("confirmAdd");
        container.classList.remove("search-expanded");
        document.getElementById("addBox").style.display = "none";
        confirmBtn.style.display = "none";
        isAddExpanded = false;
      } else {
        alert("Failed to add word: " + (result.message || "Unknown reason"));
      }
    } else {
      alert("Error: " + response.status + " " + response.statusText);
    }
  } catch (error) {
    console.error("Error adding word:", error);
  }
}

// Click event for "Add" button
document.getElementById("confirmAdd").addEventListener("click", addNewWord);

// Enter key in addBox
document.getElementById("addBox").addEventListener("keypress", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    addNewWord();
  }
});
