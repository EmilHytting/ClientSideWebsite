document.addEventListener("DOMContentLoaded", function () {
  const navLinks = document.querySelectorAll("#mainNav .nav-link");
  navLinks.forEach((link) => {
    link.addEventListener("click", function (e) {
      navLinks.forEach((l) => l.classList.remove("active", "bg-danger"));
      this.classList.add("active", "bg-danger");
    });
  });
});

// --- Navigation: Gør det aktive menupunkt synligt ---
document.addEventListener("DOMContentLoaded", function () {
  const navLinks = document.querySelectorAll("#mainNav .nav-link");
  navLinks.forEach((link) => {
    link.addEventListener("click", function () {
      // Fjern .active fra alle links
      navLinks.forEach((l) => l.classList.remove("active", "bg-danger"));
      // Tilføj .active til det valgte link
      this.classList.add("active", "bg-danger");
    });
  });
});

// --- Bil-klasser ---
// Car: En bil med navn, årgang og pris
class Car {
  constructor(navn, årgang, pris) {
    this.name = navn;
    this.year = parseInt(årgang);
    this.price = parseFloat(pris);
  }
  // Beregn bilens alder
  getAge() {
    const nuværendeÅr = new Date().getFullYear();
    return nuværendeÅr - this.year;
  }
}

// CarModel: En bil med modelnavn (arver fra Car)
class CarModel extends Car {
  constructor(navn, årgang, pris, model) {
    super(navn, årgang, pris);
    this.model = model;
  }
}

// --- Hent referencer til HTML-elementer ---
const carTableBody = document.getElementById("carTableBody"); // Tabelens tbody
const carCountSpan = document.getElementById("carCount"); // Antal Car
const carModelCountSpan = document.getElementById("carModelCount"); // Antal CarModel


// Advarsels besked når du fjerner en bil (bruges kun i deleteCar)
const warningMsg = document.getElementById("warningMsg");
if (warningMsg) warningMsg.classList.add("d-none");


// Hent biler fra localStorage hvis de findes
let cars = [];
const gemteBiler = localStorage.getItem("cars");
if (gemteBiler) {
  // Parse og genskab Car/CarModel-objekter
  const arr = JSON.parse(gemteBiler);
  cars = arr.map(obj => {
    if (obj.model) {
      return new CarModel(obj.name, obj.year, obj.price, obj.model);
    } else {
      return new Car(obj.name, obj.year, obj.price);
    }
  });
}
// Pagination (sideopdeling)
let currentPage = 1; 
const rowsPerPage = 5; 


// Opdater tællere under tabellen
function updateCounts() {
  let antalCar = 0;
  let antalCarModel = 0;
  cars.forEach((obj) => {
    if (obj instanceof CarModel) antalCarModel++;
    else if (obj instanceof Car) antalCar++;
  });
  carCountSpan.textContent = `Antal Car objekter defineret: ${antalCar}`;
  carModelCountSpan.textContent = `Antal CarModel objekter defineret: ${antalCarModel}`;
}



// Tegn tabellen med biler (kun dem på den aktuelle side)
function renderTable() {
  carTableBody.innerHTML = "";
  // Udregn hvilke biler der skal vises på denne side
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, cars.length);
  for (let i = startIndex; i < endIndex; i++) {
    const car = cars[i];
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${car.name}</td>
      <td>${car.year}</td>
      <td>${car.getAge()}</td>
      <td>${car.price.toLocaleString("da-DK", { style: "currency", currency: "DKK" })}</td>
      <td>${car instanceof CarModel ? car.model : ""}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteCar(${i})">Slet</button></td>
    `;
    carTableBody.appendChild(tr);
  }
  updateCounts();
  renderPagination();
  // Gem biler i localStorage hver gang tabellen opdateres
  localStorage.setItem("cars", JSON.stringify(cars));
}


// Tegn knapper til at bladre mellem sider
function renderPagination() {
  let paginationDiv = document.getElementById("pagination");
  if (!paginationDiv) {
    paginationDiv = document.createElement("div");
    paginationDiv.id = "pagination";
    paginationDiv.className = "d-flex justify-content-center align-items-center mt-3";
    carTableBody.parentElement.appendChild(paginationDiv);
  }
  const totalPages = Math.ceil(cars.length / rowsPerPage) || 1;
  let html = '';
  // Forrige-knap
  html += `<button class="btn btn-outline-primary btn-sm me-2" ${currentPage === 1 ? 'disabled' : ''} onclick="prevPage()">Forrige</button>`;
  // Side-indikator
  html += `<span class="mx-2">Side ${currentPage} af ${totalPages}</span>`;
  // Næste-knap
  html += `<button class="btn btn-outline-primary btn-sm ms-2" ${currentPage === totalPages ? 'disabled' : ''} onclick="nextPage()">Næste</button>`;
  paginationDiv.innerHTML = html;
}

// Gå til forrige side
window.prevPage = function() {
  if (currentPage > 1) {
    currentPage--;
    renderTable();
  }
};

// Gå til næste side
window.nextPage = function() {
  const totalPages = Math.ceil(cars.length / rowsPerPage) || 1;
  if (currentPage < totalPages) {
    currentPage++;
    renderTable();
  }
};


// Slet en bil fra listen
window.deleteCar = function (idx) {
  if (!warningMsg) {
    // fallback hvis warningMsg ikke findes
    if (confirm("Are you sure you want to delete this vehicle?")) {
      cars.splice(idx, 1);
      const totalPages = Math.ceil(cars.length / rowsPerPage) || 1;
      if (currentPage > totalPages) currentPage = totalPages;
      renderTable();
    }
    return;
  }
  warningMsg.textContent = "Er du sikker på, at du vil slette dette køretøj?";
  if (confirm("Er du sikker på, at du vil slette dette køretøj?")) {
    cars.splice(idx, 1);
    const totalPages = Math.ceil(cars.length / rowsPerPage) || 1;
    if (currentPage > totalPages) currentPage = totalPages;
    renderTable();
    warningMsg.classList.add("d-none");
  } else {
    warningMsg.classList.remove("d-none");
  }
};


// Når man trykker "Tilføj Car eller Car Model"
document.getElementById("carForm").addEventListener("submit", function (e) {
  e.preventDefault();
  // Hent værdier fra inputfelter
  const navn = document.getElementById("carName").value.trim();
  const årgang = document.getElementById("carYear").value;
  const pris = document.getElementById("carPrice").value;
  const model = document.getElementById("carModel").value.trim();
  if (!navn || !årgang || !pris) return;
  let bilObjekt;
  if (model) {
    bilObjekt = new CarModel(navn, årgang, pris, model);
  } else {
    bilObjekt = new Car(navn, årgang, pris);
  }
  cars.push(bilObjekt);
  // Gå til sidste side, så man ser den nye bil
  currentPage = Math.ceil(cars.length / rowsPerPage);
  renderTable();
  // localStorage opdateres automatisk i renderTable
  this.reset();
});


// Nulstil alle inputfelter
document.getElementById("resetBtn").addEventListener("click", function () {
  document.getElementById("carForm").reset();
});


// Vis tabellen første gang når siden indlæses
renderTable();