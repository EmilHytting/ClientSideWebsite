// Indkapsling for at undgå globale navne-konflikter
(function () {
  // --- TypeScript interfaces ---
  interface CarData {
    carId: number;
    carName: string;
    carYear: number;
    carPrice: number;
    carModel?: string;
    $type?: string;
  }

//   declare const $: any;

  // --- jQuery loader til API-menu ---
  $(document).on("click", ".dropdown-item[data-htmlpageurl]", function (e: any) {
    e.preventDefault();
    const htmlUrl: string = $(this).data("htmlpageurl");
    const jsUrl: string = $(this).data("jsmoduleurl");
    const callback: string = $(this).data("callbackfunctionname");
    const targetClass: string = $(this).data("targetclassname");

    // Indlæs HTML ind i det ønskede element
    $("." + targetClass).load(htmlUrl, function () {
      if (jsUrl) {
        $.getScript(jsUrl, function () {
          if (callback && typeof (window as any)[callback] === "function") {
            (window as any)[callback]();
          }
        });
      }
    });
  });

  // jQuery kode.
  $(document).ready(function () {
    $("#mainNav .nav-link").on("click", function (this: HTMLElement) {
      $("#mainNav .nav-link").removeClass("active");
      $(this as HTMLElement).addClass("active");
    });

    $("#carTableBody").hide().fadeIn(1000);

    if ($("#rowInfo").length === 0) {
      $(
        "<div id='rowInfo' style='display:none; margin-top:10px; font-weight:bold; color:#1746a2;'></div>"
      ).insertAfter("table.table");
    }
    $(document).on("mouseenter", "#carTableBody tr", function () {
      $(this).addClass("row-highlight row-border");
      const carName: string = $(this).find("td").eq(0).text();
      $("#rowInfo")
        .text("Du holder musen over bilen: " + carName)
        .fadeIn(150);
    });
    $(document).on("mouseleave", "#carTableBody tr", function () {
      $(this).removeClass("row-highlight row-border");
      $("#rowInfo").fadeOut(150);
    });

    // Nulstiller formlen.
    $("#resetBtn").on("click", function () {
      (("#carForm")[0] as HTMLFormElement).reset();
    });
  });

  // --- Bil-klasser ---
  class Car {
    public carId: number;
    public carName: string;
    public carYear: number;
    public carPrice: number;

    constructor(carName: string, carYear: number | string, carPrice: number | string) {
      this.carId = 0;
      this.carName = carName;
      this.carYear = parseInt(carYear.toString());
      this.carPrice = parseFloat(carPrice.toString());
    }

    getAge(): number {
      const nuværendeÅr: number = new Date().getFullYear();
      return nuværendeÅr - this.carYear;
    }
  }

  class CarModel extends Car {
    public carModel: string;
    constructor(carName: string, carYear: number | string, carPrice: number | string, carModel: string = "") {
      super(carName, carYear, carPrice);
      this.carModel = carModel;
    }
  }

  // --- Hent referencer til HTML-elementer ---
  const carTableBody: HTMLTableSectionElement = document.getElementById("carTableBody") as HTMLTableSectionElement;
  const carCountSpan: HTMLSpanElement = document.getElementById("carCount") as HTMLSpanElement;
  const carModelCountSpan: HTMLSpanElement = document.getElementById("carModelCount") as HTMLSpanElement;

  const warningMsg: HTMLElement | null = document.getElementById("warningMsg");
  if (warningMsg) warningMsg.classList.add("d-none");

  let cars: Array<Car | CarModel> = [];
  const gemteBiler: string | null = localStorage.getItem("cars");
  if (gemteBiler) {
    const arr: any[] = JSON.parse(gemteBiler);
    cars = arr.map((obj: any) => {
      if (obj.carModel) {
        return new CarModel(obj.carName, obj.carYear, obj.carPrice, obj.carModel);
      } else {
        return new Car(obj.carName, obj.carYear, obj.carPrice);
      }
    });
  }

  let currentPage: number = 1;
  const rowsPerPage: number = 5;

  function updateCounts(): void {
    let antalCar: number = 0;
    let antalCarModel: number = 0;
    cars.forEach((obj: Car | CarModel) => {
      if (obj instanceof CarModel) antalCarModel++;
      else if (obj instanceof Car) antalCar++;
    });
    if (carCountSpan) carCountSpan.textContent = `Antal Car objekter defineret: ${antalCar}`;
    if (carModelCountSpan) carModelCountSpan.textContent = `Antal CarModel objekter defineret: ${antalCarModel}`;
  }

  function renderTable(): void {
    if (!carTableBody) return;
    carTableBody.innerHTML = "";
    const startIndex: number = (currentPage - 1) * rowsPerPage;
    const endIndex: number = Math.min(startIndex + rowsPerPage, cars.length);
    for (let i = startIndex; i < endIndex; i++) {
      const car: Car | CarModel = cars[i];
      const price: number =
        typeof car.carPrice === "number" && !isNaN(car.carPrice)
          ? car.carPrice
          : 0;
      const tr: HTMLTableRowElement = document.createElement("tr");
      tr.innerHTML = `
        <td>${car.carName || ""}</td>
        <td>${car.carYear || ""}</td>
        <td>${car.getAge()}</td>
        <td>${price.toLocaleString("da-DK", {
          style: "currency",
          currency: "DKK",
        })}</td>
        <td>${(car instanceof CarModel) ? (car as CarModel).carModel : ""}</td>
        <td><button class="btn btn-danger btn-sm" onclick="deleteCar(${i})">Slet</button></td>
      `;
      carTableBody.appendChild(tr);
    }
    updateCounts();
    renderPagination();
    localStorage.setItem("cars", JSON.stringify(cars));
  }

  function renderPagination(): void {
    let paginationDiv: HTMLElement | null = document.getElementById("pagination");
    if (!paginationDiv) {
      paginationDiv = document.createElement("div");
      paginationDiv.id = "pagination";
      paginationDiv.className =
        "d-flex justify-content-center align-items-center mt-3";
      if (carTableBody && carTableBody.parentElement) {
        carTableBody.parentElement.appendChild(paginationDiv);
      }
    }
    const totalPages: number = Math.ceil(cars.length / rowsPerPage) || 1;
    let html: string = "";
    html += `<button class="btn btn-outline-primary btn-sm me-2" ${
      currentPage === 1 ? "disabled" : ""
    } onclick="prevPage()">Forrige</button>`;
    html += `<span class="mx-2">Side ${currentPage} af ${totalPages}</span>`;
    html += `<button class="btn btn-outline-primary btn-sm ms-2" ${
      currentPage === totalPages ? "disabled" : ""
    } onclick="nextPage()">Næste</button>`;
    paginationDiv.innerHTML = html;
  }

  (window as any).prevPage = function (): void {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  };

  (window as any).nextPage = function (): void {
    const totalPages: number = Math.ceil(cars.length / rowsPerPage) || 1;
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
    }
  };

  (window as any).deleteCar = function (idx: number): void {
    if (!warningMsg) {
      if (confirm("Are you sure you want to delete this vehicle?")) {
        cars.splice(idx, 1);
        const totalPages: number = Math.ceil(cars.length / rowsPerPage) || 1;
        if (currentPage > totalPages) currentPage = totalPages;
        renderTable();
      }
      return;
    }
    warningMsg.textContent = "Er du sikker på, at du vil slette dette køretøj?";
    if (confirm("Er du sikker på, at du vil slette dette køretøj?")) {
      cars.splice(idx, 1);
      const totalPages: number = Math.ceil(cars.length / rowsPerPage) || 1;
      if (currentPage > totalPages) currentPage = totalPages;
      renderTable();
      warningMsg.classList.add("d-none");
    } else {
      warningMsg.classList.remove("d-none");
    }
  };

  document.getElementById("carForm")!.addEventListener("submit", function (e: Event) {
    e.preventDefault();
    const navn: string = (document.getElementById("carName") as HTMLInputElement).value.trim();
    const årgang: string = (document.getElementById("carYear") as HTMLInputElement).value;
    const pris: string = (document.getElementById("carPrice") as HTMLInputElement).value;
    const model: string = (document.getElementById("carModel") as HTMLInputElement).value.trim();
    if (!navn || !årgang || !pris) return;
    let bilObjekt: Car | CarModel;
    if (model) {
      bilObjekt = new CarModel(navn, årgang, pris, model);
    } else {
      bilObjekt = new Car(navn, årgang, pris);
    }
    cars.push(bilObjekt);
    currentPage = Math.ceil(cars.length / rowsPerPage);
    renderTable();
    (this as HTMLFormElement).reset();
  });

  document.getElementById("resetBtn")!.addEventListener("click", function () {
    (document.getElementById("carForm") as HTMLFormElement).reset();
  });

  if (!document.getElementById("fetchApiBtn")) {
    const btn: HTMLButtonElement = document.createElement("button");
    btn.id = "fetchApiBtn";
    btn.className = "btn btn-info mb-3";
    btn.textContent = "Hent fra API";
    document.querySelector(".form-buttons")!.appendChild(btn);
    btn.addEventListener("click", fetchFromApi);
  }

  async function fetchFromApi(): Promise<void> {
    try {
      const response: Response = await fetch(
        "https://car.buchwaldshave34.dk/api/CarFamily"
      );
      if (!response.ok) throw new Error("API-fejl: " + response.status);
      const apiCars: CarData[] = await response.json();
      cars = [];
      apiCars.forEach((obj: CarData) => {
        if (obj.$type === "carModel") {
          cars.push(
            new CarModel(
              obj.carName || "Ukendt",
              obj.carYear || 2000,
              obj.carPrice || 0,
              obj.carModel || ""
            )
          );
        } else {
          cars.push(
            new Car(
              obj.carName || "Ukendt",
              obj.carYear || 2000,
              obj.carPrice || 0
            )
          );
        }
      });
      currentPage = 1;
      renderTable();
      alert("Biler hentet fra API!");
    } catch (err) {
      alert("Kunne ikke hente data fra API: " + (err as Error).message);
    }
  }

  if (!document.getElementById("sendApiBtn")) {
    const btn: HTMLButtonElement = document.createElement("button");
    btn.id = "sendApiBtn";
    btn.className = "btn btn-success mb-3 ms-2";
    btn.textContent = "Send til API";
    document.querySelector(".form-buttons")!.appendChild(btn);
    btn.addEventListener("click", sendCarToApi);
  }

  async function sendCarToApi(e: Event): Promise<void> {
    e.preventDefault();
    const navn: string = (document.getElementById("carName") as HTMLInputElement).value.trim();
    const årgang: string = (document.getElementById("carYear") as HTMLInputElement).value;
    const pris: string = (document.getElementById("carPrice") as HTMLInputElement).value;
    if (!navn || !årgang || !pris) {
      alert("Udfyld alle felter!");
      return;
    }
    const body: Omit<CarData, '$type' | 'carModel'> = {
      carId: 0,
      carName: navn,
      carYear: parseInt(årgang),
      carPrice: parseFloat(pris),
    };
    try {
      const response: Response = await fetch(
        "https://car.buchwaldshave34.dk/api/CarFamily?userName=Default%20User",
        {
          method: "POST",
          headers: {
            accept: "*/*",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );
      if (!response.ok) throw new Error("API-fejl: " + response.status);
      alert("Bil sendt til API!");
    } catch (err) {
      alert("Kunne ikke sende til API: " + (err as Error).message);
    }
  }

  renderTable();
})();