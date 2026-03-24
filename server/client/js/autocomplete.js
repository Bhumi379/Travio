// Location Autocomplete Functions

/* ==============================
   LOCATION AUTOCOMPLETE (For Create Ride Form)
================================ */
export function setupOSMAutocomplete(inputId, onSelect) {
  console.log("🔧 setupOSMAutocomplete called for", inputId);

  const input = document.getElementById(inputId);
  if (!input) {
    console.error("❌ Input not found:", inputId);
    return;
  }

  // Create dropdown inside the autocomplete-wrapper
  const wrapper = input.closest('.autocomplete-wrapper');
  if (!wrapper) {
    console.error("❌ No autocomplete-wrapper found for", inputId);
    return;
  }

  const dropdown = document.createElement("div");
  dropdown.className = "autocomplete-list";
  wrapper.appendChild(dropdown);

  let debounceTimer;

  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(async () => {
      const query = input.value.trim();
      dropdown.innerHTML = "";

      if (query.length < 3) return;

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&countrycodes=in&limit=5&addressdetails=1`
        );

        const data = await res.json();

        data.forEach(place => {
          const div = document.createElement("div");
          div.className = "autocomplete-item";
          div.textContent = place.display_name;

          div.onclick = () => {
            input.value = place.display_name;
            dropdown.innerHTML = "";

            onSelect({
              name: place.name || place.display_name.split(",")[0],
              address: place.display_name,
              latitude: Number(place.lat),
              longitude: Number(place.lon)
            });
          };

          dropdown.appendChild(div);
        });
      } catch (err) {
        console.error("Error fetching locations:", err);
      }
    }, 300);
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      dropdown.innerHTML = "";
    }
  });
}

/* ==============================
   SEARCH BAR AUTOCOMPLETE (For Home Search)
================================ */
export function setupSearchAutocomplete(inputId) {
  console.log("🔧 setupSearchAutocomplete called for", inputId);

  const input = document.getElementById(inputId);
  if (!input) {
    console.error("❌ Input not found:", inputId);
    return;
  }

  // Find the existing dropdown (don't create a new one)
  const wrapper = input.closest('.autocomplete-wrapper');
  if (!wrapper) {
    console.error("❌ No autocomplete-wrapper found for", inputId);
    return;
  }

  // Use the existing <ul> element with class "autocomplete-dropdown"
  const dropdown = wrapper.querySelector('.autocomplete-dropdown');
  if (!dropdown) {
    console.error("❌ No autocomplete-dropdown found for", inputId);
    return;
  }

  let debounceTimer;

  input.addEventListener("input", () => {
    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(async () => {
      const query = input.value.trim();
      dropdown.innerHTML = ""; // Clear previous results

      if (query.length < 3) return;

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            query
          )}&countrycodes=in&limit=5&addressdetails=1`
        );

        const data = await res.json();

        // Create <li> elements (not div) for each result
        data.forEach(place => {
          const li = document.createElement("li");
          li.textContent = place.display_name;

          li.onclick = () => {
            input.value = place.display_name;
            dropdown.innerHTML = ""; // Clear dropdown after selection
          };

          dropdown.appendChild(li);
        });
      } catch (err) {
        console.error("Error fetching locations:", err);
      }
    }, 300);
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      dropdown.innerHTML = "";
    }
  });
}
