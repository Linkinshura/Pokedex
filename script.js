const grid = document.getElementById("pokemonGrid");
const favoritesGrid = document.getElementById("favoritesGrid");

const search = document.getElementById("search");
const typeFilter = document.getElementById("typeFilter");
const regionFilter = document.getElementById("regionFilter");

const modal = document.getElementById("modal");
const details = document.getElementById("pokemonDetails");

const toast = document.getElementById("toast");

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
    1: [1, 151],
    2: [152, 251],
    3: [252, 386],
    4: [387, 493],
    5: [494, 649],
    6: [650, 721],
    7: [722, 809],
    8: [810, 905],
    9: [906, 1025]
};

let offset = 0;
const limit = 20;

let currentPokemons = [];

async function loadTypes() {
    const res = await fetch("https://pokeapi.co/api/v2/type");
    const data = await res.json();

    data.results.forEach(type => {
        const option = document.createElement("option");

        option.value = type.name;
        option.textContent =
            typeTranslations[type.name] || type.name;

        typeFilter.appendChild(option);
    });
}

async function loadPokemons() {
    grid.innerHTML = "<h2>Cargando...</h2>";

    const res = await fetch(
        `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`
    );

    const data = await res.json();

    currentPokemons = await Promise.all(
        data.results.map(async pokemon => {
            const response = await fetch(pokemon.url);
            return response.json();
        })
    );

    renderPokemons();
}

function renderPokemons() {
    const term = search.value.toLowerCase();
    const selectedType = typeFilter.value;
    const selectedRegion = regionFilter.value;

    grid.innerHTML = "";

    const filteredPokemons = currentPokemons.filter(pokemon => {

        const matchesName =
            pokemon.name.includes(term);

        const matchesType =
            !selectedType ||
            pokemon.types.some(
                t => t.type.name === selectedType
            );

        let matchesRegion = true;

        if (selectedRegion) {
            const [min, max] =
                regions[selectedRegion];

            matchesRegion =
                pokemon.id >= min &&
                pokemon.id <= max;
        }

        return (
            matchesName &&
            matchesType &&
            matchesRegion
        );
    });

    filteredPokemons.forEach(createCard);

    if (filteredPokemons.length === 0) {
        grid.innerHTML = `
            <h2 style="grid-column:1/-1;text-align:center;">
                No se encontraron Pokémon
            </h2>
        `;
    }
}

function createCard(pokemon) {
    const card = document.createElement("div");

    card.className = "card";

    card.innerHTML = `
        <img src="${pokemon.sprites.other["official-artwork"].front_default}" alt="${pokemon.name}">
        <div class="card-body">
            <h3>${pokemon.name}</h3>

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
            width="250"
            alt="${pokemon.name}"
        >

        <p>Altura: ${pokemon.height}</p>
        <p>Peso: ${pokemon.weight}</p>

        <div class="stats">
            ${pokemon.stats.map(stat => `
                <p>${stat.stat.name}</p>

                <div class="bar">
                    <div
                        class="fill"
                        style="width:${Math.min(stat.base_stat, 100)}%"
                    ></div>
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

    const exists = favorites.some(
        p => p.id === pokemon.id
    );

    if (!exists) {
        favorites.push(pokemon);

        localStorage.setItem(
            "favorites",
            JSON.stringify(favorites)
        );

        showToast(`${pokemon.name} agregado a favoritos`);
        renderFavorites();
    } else {
        showToast(`${pokemon.name} ya está en favoritos`);
    }
}

function removeFavorite(id) {
    let favorites =
        JSON.parse(
            localStorage.getItem("favorites")
        ) || [];

    favorites = favorites.filter(
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

    if (favorites.length === 0) {
        favoritesGrid.innerHTML = `
            <h3 style="grid-column:1/-1;text-align:center;">
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
        <img src="${pokemon.sprites.other["official-artwork"].front_default}" alt="${pokemon.name}">
        <div class="card-body">
            <h3>${pokemon.name}</h3>

            <button class="favorite-btn">
                Quitar
            </button>
        </div>
    `;

    card.querySelector(".favorite-btn")
        .addEventListener("click", () => {
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

if (regionFilter) {
    regionFilter.addEventListener(
        "change",
        renderPokemons
    );
}

document
    .getElementById("nextBtn")
    .addEventListener("click", () => {
        offset += limit;
        loadPokemons();
    });

document
    .getElementById("prevBtn")
    .addEventListener("click", () => {
        if (offset >= limit) {
            offset -= limit;
            loadPokemons();
        }
    });

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
loadPokemons();
renderFavorites();