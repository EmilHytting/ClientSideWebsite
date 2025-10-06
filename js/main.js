// --- jQuery loader til API-menu ---
$(document).on("click", ".dropdown-item[data-htmlpageurl]", function (e) {
  e.preventDefault();
  var htmlUrl = $(this).data("htmlpageurl");
  var jsUrl = $(this).data("jsmoduleurl");
  var callback = $(this).data("callbackfunctionname");
  var targetClass = $(this).data("targetclassname");

  $("." + targetClass).load(htmlUrl, function () {
    if (jsUrl) {
      $.getScript(jsUrl, function () {
        if (callback && typeof window[callback] === "function") {
          window[callback]();
        }
      });
    }
  });
});

$(document).ready(function () {
  $("#mainNav .nav-link").on("click", function () {
    $("#mainNav .nav-link").removeClass("active");
    $(this).addClass("active");
  });

  $("#carTableBody").hide().fadeIn(1000);

  if ($("#rowInfo").length === 0) {
    $(
      "<div id='rowInfo' style='display:none; margin-top:10px; font-weight:bold; color:#1746a2;'></div>"
    ).insertAfter("table.table");
  }

  $(document).on("mouseenter", "#carTableBody tr", function () {
    $(this).addClass("row-highlight row-border");
    var carName = $(this).find("td").eq(1).text();
    $("#rowInfo")
      .text("Du holder musen over bilen: " + carName)
      .fadeIn(150);
  });

  $(document).on("mouseleave", "#carTableBody tr", function () {
    $(this).removeClass("row-highlight row-border");
    $("#rowInfo").fadeOut(150);
  });

  $("#resetBtn").on("click", function () {
    $("#carForm")[0].reset();
  });
});

// --- Bil-klasser ---
class Car {
  constructor(carName, carYear, carPrice, carId = 0) {
    this.carId = carId;
    this.carName = carName;
    this.carYear = parseInt(carYear);
    this.carPrice = parseFloat(carPrice);
  }
  getAge() {
    return new Date().getFullYear() - this.carYear;
  }
}

class CarModel extends Car {
  constructor(carName, carYear, carPrice, carModel, carId = 0) {
    super(carName, carYear, carPrice, carId);
    this.carModel = carModel || "";
  }
}

// --- HTML referencer ---
const carTableBody = document.getElementById("carTableBody");
const carCountSpan = document.getElementById("carCount");
const carModelCountSpan = document.getElementById("carModelCount");

// --- LocalStorage ---
let cars = [];
const gemteBiler = localStorage.getItem("cars");
if (gemteBiler) {
  const arr = JSON.parse(gemteBiler);
  cars = arr.map((obj) =>
    obj.carModel
      ? new CarModel(
          obj.carName,
          obj.carYear,
          obj.carPrice,
          obj.carModel,
          obj.carId || 0
        )
      : new Car(obj.carName, obj.carYear, obj.carPrice, obj.carId || 0)
  );
}

let currentPage = 1;
const rowsPerPage = 5;

// --- Tællere ---
function updateCounts() {
  const antalCar = cars.filter(
    (c) => c instanceof Car && !(c instanceof CarModel)
  ).length;
  const antalCarModel = cars.filter((c) => c instanceof CarModel).length;
  carCountSpan.textContent = `Antal Car objekter defineret: ${antalCar}`;
  carModelCountSpan.textContent = `Antal CarModel objekter defineret: ${antalCarModel}`;
}

// --- Render tabel ---
function renderTable() {
  carTableBody.innerHTML = "";
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = Math.min(startIndex + rowsPerPage, cars.length);
  for (let i = startIndex; i < endIndex; i++) {
    const car = cars[i];
    const price = car.carPrice ?? 0;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${car.carId || ""}</td>
      <td>${car.carName || ""}</td>
      <td>${car.carYear || ""}</td>
      <td>${car.getAge ? car.getAge() + " år" : ""}</td>
      <td>${price.toLocaleString("da-DK", {
        style: "currency",
        currency: "DKK",
      })}</td>
      <td>${car.carModel || ""}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteCar(${i})">Slet</button>
        <button class="btn btn-secondary btn-sm" onclick="editCar(${i})">Ret</button>
      </td>`;
    carTableBody.appendChild(tr);
  }
  updateCounts();
  renderPagination();
  localStorage.setItem("cars", JSON.stringify(cars));
}

// --- Pagination ---
function renderPagination() {
  let paginationDiv = document.getElementById("pagination");
  if (!paginationDiv) {
    paginationDiv = document.createElement("div");
    paginationDiv.id = "pagination";
    paginationDiv.className =
      "d-flex justify-content-center align-items-center mt-3";
    carTableBody.parentElement.appendChild(paginationDiv);
  }
  const totalPages = Math.ceil(cars.length / rowsPerPage) || 1;
  paginationDiv.innerHTML = `
    <button class="btn btn-outline-primary btn-sm me-2" ${
      currentPage === 1 ? "disabled" : ""
    } onclick="prevPage()">Forrige</button>
    <span class="mx-2">Side ${currentPage} af ${totalPages}</span>
    <button class="btn btn-outline-primary btn-sm ms-2" ${
      currentPage === totalPages ? "disabled" : ""
    } onclick="nextPage()">Næste</button>`;
}

window.prevPage = function () {
  if (currentPage > 1) {
    currentPage--;
    renderTable();
  }
};
window.nextPage = function () {
  const totalPages = Math.ceil(cars.length / rowsPerPage) || 1;
  if (currentPage < totalPages) {
    currentPage++;
    renderTable();
  }
};

// --- DELETE fra API ---
window.deleteCar = async function (idx) {
  const car = cars[idx];
  if (!car || !car.carId) {
    alert("Bilen har ikke et gyldigt ID.");
    return;
  }
  try {
    const res = await fetch(
      `https://car.buchwaldshave34.dk/api/CarFamily/${car.carId}?userName=Default%20User`,
      {
        method: "DELETE",
        headers: { accept: "*/*" },
      }
    );
    if (!res.ok) throw new Error(await res.text());
    alert(`Bil ${car.carId} slettet fra API`);
    cars.splice(idx, 1);
    renderTable();
  } catch (err) {
    alert("Fejl ved sletning: " + err.message);
  }
};

// --- Tilføj bil lokalt ---
document.getElementById("carForm").addEventListener("submit", function (e) {
  e.preventDefault();
  const navn = document.getElementById("carName").value.trim();
  const årgang = parseInt(document.getElementById("carYear").value);
  const pris = parseFloat(document.getElementById("carPrice").value);
  const model = document.getElementById("carModel").value.trim();

  if (!navn || !årgang || isNaN(pris)) return;

  const bilObjekt = model
    ? new CarModel(navn, årgang, pris, model)
    : new Car(navn, årgang, pris);
  cars.push(bilObjekt);
  currentPage = Math.ceil(cars.length / rowsPerPage);
  renderTable();
  e.target.reset();
});

// --- FETCH fra API ---
async function fetchFromApi() {
  try {
    const response = await fetch(
      "https://car.buchwaldshave34.dk/api/CarFamily"
    );
    if (!response.ok) throw new Error("API-fejl: " + response.status);
    const apiCars = await response.json();
    cars = apiCars.map((obj) =>
      obj.$type === "carModel"
        ? new CarModel(
            obj.carName,
            obj.carYear,
            obj.carPrice,
            obj.carModel,
            obj.carId
          )
        : new Car(obj.carName, obj.carYear, obj.carPrice, obj.carId)
    );
    currentPage = 1;
    renderTable();
    alert("Biler hentet fra API!");
  } catch (err) {
    alert("Kunne ikke hente data: " + err.message);
  }
}

if (!document.getElementById("fetchApiBtn")) {
  const btn = document.createElement("button");
  btn.id = "fetchApiBtn";
  btn.className = "btn btn-info mb-3";
  btn.textContent = "Hent fra API";
  document.querySelector(".form-buttons").appendChild(btn);
  btn.addEventListener("click", fetchFromApi);
}

// --- POST til API ---
async function sendCarToApi(e) {
  e.preventDefault();
  const navn = document.getElementById("carName").value.trim();
  const årgang = parseInt(document.getElementById("carYear").value);
  const pris = parseFloat(document.getElementById("carPrice").value);
  const model = document.getElementById("carModel").value.trim();

  if (!navn || !årgang || isNaN(pris)) {
    alert("Udfyld alle felter!");
    return;
  }

  const body = model
    ? {
        $type: "carModel",
        carName: navn,
        carYear: årgang,
        carPrice: pris,
        carModel: model,
      }
    : { $type: "car", carName: navn, carYear: årgang, carPrice: pris };

  console.log("Sender til API:", JSON.stringify(body, null, 2));

  try {
    const res = await fetch(
      "https://car.buchwaldshave34.dk/api/CarFamily?userName=Default%20User",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", accept: "*/*" },
        body: JSON.stringify(body),
      }
    );

    if (!res.ok) throw new Error(await res.text());
    const result = await res.json();
    alert("Bil sendt til API med ID: " + result.carId);

    if (model)
      cars.push(new CarModel(navn, årgang, pris, model, result.carId || 0));
    else cars.push(new Car(navn, årgang, pris, result.carId || 0));

    renderTable();
  } catch (err) {
    alert("Fejl ved POST: " + err.message);
  }
}

// --- PUT til API ---
async function updateCarInApi(carObj) {
  const url = `https://car.buchwaldshave34.dk/api/CarFamily/${carObj.carId}?userName=Default%20User`;
  const body =
    carObj instanceof CarModel
      ? {
          $type: "carModel",
          carId: carObj.carId,
          carName: carObj.carName,
          carYear: carObj.carYear,
          carPrice: carObj.carPrice,
          carModel: carObj.carModel,
        }
      : {
          $type: "car",
          carId: carObj.carId,
          carName: carObj.carName,
          carYear: carObj.carYear,
          carPrice: carObj.carPrice,
        };

  console.log("PUT til API:", JSON.stringify(body, null, 2));
  const response = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json", accept: "*/*" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(await response.text());
  return await response.json();
}

// --- Table header ---
const table = carTableBody ? carTableBody.parentElement : null;
if (table) {
  let thead = table.querySelector("thead");
  if (!thead) {
    thead = document.createElement("thead");
    table.insertBefore(thead, table.firstChild);
  }
  thead.innerHTML = `
    <tr>
      <th>Bil Id</th>
      <th>Bilnavn</th>
      <th>Bil Årgang</th>
      <th>Bil Alder</th>
      <th>Bil Pris</th>
      <th>Bil Model</th>
      <th>Handlinger</th>
    </tr>`;
}

if (!document.getElementById("sendApiBtn")) {
  const btn = document.createElement("button");
  btn.id = "sendApiBtn";
  btn.className = "btn btn-success mb-3 ms-2";
  btn.textContent = "Send til API";
  document.querySelector(".form-buttons").appendChild(btn);
  btn.addEventListener("click", sendCarToApi);
}

renderTable();
