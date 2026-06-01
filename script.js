const grid = document.getElementById("pokemonGrid");
const favoritesGrid = document.getElementById("favoritesGrid");

const search = document.getElementById("search");
const typeFilter = document.getElementById("typeFilter");
const regionFilter = document.getElementById("regionFilter");

const modal = document.getElementById("modal");
const details = document.getElementById("pokemonDetails");

const toast = document.getElementById("toast");

const pokemonCount = document.getElementById("pokemonCount");
const favoritesCount = document.getElementById("favoritesCount");

function translateStat(stat){

    const stats = {
        hp: "PS",
        attack: "Ataque",
        defense: "Defensa",
        "special-attack": "Ataque Especial",
        "special-defense": "Defensa Especial",
        speed: "Velocidad"
    };

    return stats[stat] || stat;
}

const typeTranslations = {
    normal: "Normal",
    fire: "Fuego",
    water: "Agua",
    electric: "Eléctrico",
    grass: "Planta",
    ice: "Hielo",
    fighting: "Lucha",
    poison: "Veneno",
    ground: "Tierra",
    flying: "Volador",
    psychic: "Psíquico",
    bug: "Bicho",
    rock: "Roca",
    ghost: "Fantasma",
    dragon: "Dragón",
    dark: "Siniestro",
    steel: "Acero",
    fairy: "Hada"
};

const regions = {
    1: { name: "Kanto", min: 1, max: 151 },
    2: { name: "Johto", min: 152, max: 251 },
    3: { name: "Hoenn", min: 252, max: 386 },
    4: { name: "Sinnoh", min: 387, max: 493 },
    5: { name: "Teselia", min: 494, max: 649 },
    6: { name: "Kalos", min: 650, max: 721 },
    7: { name: "Alola", min: 722, max: 809 },
    8: { name: "Galar", min: 810, max: 905 },
    9: { name: "Paldea", min: 906, max: 1025 }
};

let currentPokemons = [];

async function loadTypes() {
    const res = await fetch("https://pokeapi.co/api/v2/type");
    const data = await res.json();

    data.results.forEach(type => {
        if (!typeTranslations[type.name]) return;

        const option = document.createElement("option");

        option.value = type.name;
        option.textContent = typeTranslations[type.name];

        typeFilter.appendChild(option);
    });
}

async function loadRegionPokemons() {
    const regionId = regionFilter.value;

    if (!regions[regionId]) return;

    grid.innerHTML = "<h2>Cargando Pokémon...</h2>";

    const region = regions[regionId];

    const promises = [];

    for (let id = region.min; id <= region.max; id++) {
        promises.push(
            fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
                .then(res => res.json())
        );
    }

    currentPokemons = await Promise.all(promises);

    renderPokemons();
}

function renderPokemons() {

    const term = search.value.toLowerCase();
    const selectedType = typeFilter.value;

    grid.innerHTML = "";

    const filtered = currentPokemons.filter(pokemon => {

        const matchesSearch =
            pokemon.name.toLowerCase().includes(term);

        const matchesType =
            !selectedType ||
            pokemon.types.some(
                t => t.type.name === selectedType
            );

        return matchesSearch && matchesType;
    });

    pokemonCount.textContent =
        `${filtered.length} Pokémon`;

    if (!filtered.length) {

        grid.innerHTML = `
            <h2 style="
                grid-column:1/-1;
                text-align:center;
            ">
                No se encontraron Pokémon
            </h2>
        `;

        return;
    }

    filtered.forEach(createPokemonCard);
}

function createPokemonCard(pokemon) {

    const card = document.createElement("div");

    card.className = "card";

    card.innerHTML = `
        <img
            src="${pokemon.sprites.other["official-artwork"].front_default}"
            alt="${pokemon.name}"
        >

        <div class="card-body">

            <h3>
                ${pokemon.name}
            </h3>

            <div class="types">
                ${pokemon.types.map(type => `
                    <span class="type">
                        ${typeTranslations[type.type.name] || type.type.name}
                    </span>
                `).join("")}
            </div>

            <button class="favorite-btn">
                Favorito
            </button>

        </div>
    `;

    card.addEventListener("click", () => {
        openModal(pokemon);
    });

    card.querySelector(".favorite-btn")
        .addEventListener("click", e => {

            e.stopPropagation();

            addFavorite(pokemon);

        });

    grid.appendChild(card);
}

function openModal(pokemon) {

    details.innerHTML = `
        <h2>${pokemon.name}</h2>

        <img
            src="${pokemon.sprites.other["official-artwork"].front_default}"
            alt="${pokemon.name}"
        >

        <p>
            <strong>N.º:</strong> ${pokemon.id}
        </p>

      <p>
    <strong>Altura:</strong> ${(pokemon.height / 10).toFixed(1)} m
</p>

<p>
    <strong>Peso:</strong> ${(pokemon.weight / 10).toFixed(1)} kg
</p>

        <div class="types" style="justify-content:center;margin:15px 0;">
            ${pokemon.types.map(type => `
                <span class="type">
                    ${typeTranslations[type.type.name] || type.type.name}
                </span>
            `).join("")}
        </div>

        <div class="stats">

          ${pokemon.stats.map(stat => `
    <div class="stat-row">

        <div class="stat-header">
            <span>${translateStat(stat.stat.name)}</span>
            <span>${stat.base_stat}</span>
        </div>

        <div class="bar">
            <div
                class="fill"
                style="width:${Math.min((stat.base_stat / 255) * 100, 100)}%"
            ></div>
        </div>

    </div>
`).join("")}

        </div>
    `;

    modal.style.display = "block";
}

document
    .getElementById("closeModal")
    .addEventListener("click", () => {

        modal.style.display = "none";

    });

window.addEventListener("click", e => {

    if (e.target === modal) {
        modal.style.display = "none";
    }

});

function addFavorite(pokemon) {

    let favorites =
        JSON.parse(
            localStorage.getItem("favorites")
        ) || [];

    const exists =
        favorites.some(
            p => p.id === pokemon.id
        );

    if (exists) {

        showToast(
            `${pokemon.name} ya está en favoritos`
        );

        return;
    }

    favorites.push(pokemon);

    localStorage.setItem(
        "favorites",
        JSON.stringify(favorites)
    );

    showToast(
        `${pokemon.name} agregado a favoritos`
    );

    renderFavorites();
}

function removeFavorite(id) {

    let favorites =
        JSON.parse(
            localStorage.getItem("favorites")
        ) || [];

    favorites =
        favorites.filter(
            pokemon => pokemon.id !== id
        );

    localStorage.setItem(
        "favorites",
        JSON.stringify(favorites)
    );

    renderFavorites();
}

function renderFavorites() {

    const favorites =
        JSON.parse(
            localStorage.getItem("favorites")
        ) || [];

    favoritesGrid.innerHTML = "";

    favoritesCount.textContent =
        `${favorites.length} Pokémon`;

    if (!favorites.length) {

        favoritesGrid.innerHTML = `
            <h3 style="
                grid-column:1/-1;
                text-align:center;
            ">
                No hay favoritos
            </h3>
        `;

        return;
    }

    favorites.forEach(createFavoriteCard);
}

function createFavoriteCard(pokemon) {

    const card = document.createElement("div");

    card.className = "card";

    card.innerHTML = `
        <img
            src="${pokemon.sprites.other["official-artwork"].front_default}"
            alt="${pokemon.name}"
        >

        <div class="card-body">

            <h3>
                ${pokemon.name}
            </h3>

            <button class="favorite-btn">
                Quitar
            </button>

        </div>
    `;

    card.addEventListener("click", () => {
        openModal(pokemon);
    });

    card.querySelector(".favorite-btn")
        .addEventListener("click", e => {

            e.stopPropagation();

            removeFavorite(pokemon.id);

        });

    favoritesGrid.appendChild(card);
}

function showToast(message) {

    toast.textContent = message;

    toast.style.opacity = "1";

    setTimeout(() => {

        toast.style.opacity = "0";

    }, 2000);
}

search.addEventListener(
    "input",
    renderPokemons
);

typeFilter.addEventListener(
    "change",
    renderPokemons
);

regionFilter.addEventListener(
    "change",
    loadRegionPokemons
);

if (localStorage.getItem("theme") === "dark") {

    document.body.classList.add("dark");

    document.getElementById("themeBtn")
        .textContent = "☀️";
}

document
    .getElementById("themeBtn")
    .addEventListener("click", () => {

        document.body.classList.toggle("dark");

        const dark =
            document.body.classList.contains("dark");

        document.getElementById("themeBtn")
            .textContent =
            dark ? "☀️" : "🌙";

        localStorage.setItem(
            "theme",
            dark ? "dark" : "light"
        );
    });

loadTypes();
loadRegionPokemons();
renderFavorites();
