const API_KEY = "8ef865d86bfeafd0447a47e4b0660775";

function getWeather() {
  const city = document.getElementById("city").value;

  if (!city) {
    alert("Please select a district.");
    return;
  }

  loadCropData(city);

  fetch(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`)
    .then(res => res.json())
    .then(data => {
      if (data.cod !== 200) {
        alert("City not found or API error.");
        return;
      }

      document.getElementById("weather").textContent = data.weather[0].main;
      document.getElementById("description").textContent = data.weather[0].description;
      document.getElementById("temperature").textContent = `${data.main.temp} °C`;
      document.getElementById("humidity").textContent = `${data.main.humidity}%`;
      document.getElementById("pressure").textContent = `${data.main.pressure} hPa`;
      document.getElementById("wind").textContent = `${data.wind.speed} m/s`;

      detectHazards(data.main.temp, data.main.humidity, data.wind.speed, city);
    })
    .catch(err => {
      console.error(err);
      alert("Weather data fetch failed.");
    });
}

function detectHazards(temp, humidity, windSpeed, city) {
  const hazards = [];
  if (humidity > 85) hazards.push("Heavy Rainfall");
  if (windSpeed > 15) hazards.push("Storm");
  if (temp > 35) hazards.push("High Temperature");

  document.getElementById("hazard").textContent = hazards.length
    ? hazards.join(", ")
    : "No Hazards Detected";

  if (hazards.includes("High Temperature")) {
    showCropImpact(city, "High Temperature");
  }
}

function loadCropData(city) {
  Papa.parse("cleaned_data.csv", {
    download: true,
    header: true,
    skipEmptyLines: true,
    transformHeader: h => h.trim(),
    complete: function(results) {
      const data = results.data;
      const filtered = data.filter(row =>
        row.District.trim().toLowerCase() === city.trim().toLowerCase()
      );

      if (filtered.length === 0) {
        document.getElementById("crop-data").innerHTML = "<p>No crop data found for this district.</p>";
        return;
      }

      let html = "<table><tr><th>Crop</th><th>Season</th><th>Area (ha)</th><th>Production (tons)</th></tr>";
      filtered.forEach(row => {
        html += `<tr>
          <td>${row.Crop}</td>
          <td>${row.Season}</td>
          <td>${row.Area}</td>
          <td>${row.Production}</td>
        </tr>`;
      });
      html += "</table>";

      document.getElementById("crop-data").innerHTML = html;
    }
  });
}

function showCropImpact(city, hazardType) {
  fetch("crop_impact.json")
    .then(res => res.json())
    .then(data => {
      const impacts = data[city]?.[hazardType];
      if (!impacts) return;

      let html = `<h3>🌡️ ${hazardType} Effects on Crops in ${city}</h3>
        <table>
          <tr>
            <th>Crop</th>
            <th>Expected Impact</th>
            <th>Mitigation Tips</th>
          </tr>`;

      impacts.forEach(entry => {
        html += `<tr>
          <td>${entry.Crop}</td>
          <td>${entry.Impact}</td>
          <td>${entry.Tip}</td>
        </tr>`;
      });
      html += "</table>";

      document.getElementById("crop-data").innerHTML += html;
    });
}
