const apiKey = "f5807df07b91404b8a2180331242411"; // Replace with your WeatherAPI.com API key
const cityInput = document.getElementById("city");
const searchButton = document.getElementById("search-btn");
const weatherDataDiv = document.getElementById("weather-data");
const hourlyDataDiv = document.getElementById("hourly-data");
const weeklyDataDiv = document.getElementById("weekly-data");
const weatherTilesDiv = document.getElementById("weather-tiles");

let unit = localStorage.getItem("unit") || "metric"; // Default unit is Celsius


// Fallback cities when location cannot be retrieved
const fallbackCities = ["New York", "London", "Tokyo"];

// List of countries you want to display
const countries = ["United States", "Canada", "Germany", "Australia", "India", "Brazil"];

// Add unit toggle button
document.addEventListener("DOMContentLoaded", () => {
    const toggleButton = document.createElement("button");
    toggleButton.className = "unit-toggle";
    toggleButton.innerText = unit === "metric" ? "Switch to °F" : "Switch to °C";
    document.body.appendChild(toggleButton);

    toggleButton.addEventListener("click", () => {
        unit = unit === "metric" ? "imperial" : "metric";
        localStorage.setItem("unit", unit);
        toggleButton.innerText = unit === "metric" ? "Switch to °F" : "Switch to °C";

        const city = localStorage.getItem("selectedCity");
        if (city) {
            fetchWeatherData(city);
            fetchHourlyForecast(city);
            fetchWeeklyForecast(city);
        }
    });

    // Check if we are on the forecast page
    if (window.location.pathname === "/forecast") {
        const selectedCity = localStorage.getItem("selectedCity");
        if (selectedCity) {
            // Fetch weather data if city is stored in localStorage
            fetchWeatherData(selectedCity);
            fetchHourlyForecast(selectedCity);
            fetchWeeklyForecast(selectedCity);
        } else {
            // Fall back to user location if no city is stored
            getUserLocation();
        }
    }
});

// Event listener for the search button
searchButton.addEventListener("click", () => {
    const city = cityInput.value.trim();
    if (!city) {
        getUserLocation();
        return;
    }

    // Save city in localStorage and redirect to forecast page
    localStorage.setItem("selectedCity", city);

    if (window.location.pathname === "/forecast") {
        // If already on forecast page, fetch data directly
        fetchWeatherData(city);
        fetchHourlyForecast(city);
        fetchWeeklyForecast(city);
    } else {
        // Redirect to forecast page
        window.location.href = "/forecast";
    }
});

// Automatically get user's location if no city is entered
function getUserLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                fetchWeatherDataByCoords(lat, lon);
                fetchHourlyForecastByCoords(lat, lon);
                fetchWeeklyForecastByCoords(lat, lon);
            },
            (error) => {
                alert("Unable to fetch your location.");
            }
        );
    } else {
        alert("Geolocation is not supported by this browser.");
    }
}

// Fetch current weather data
function fetchWeatherData(city) {
    const url = `/current_weather?city=${encodeURIComponent(city)}&unit=${unit}`;
    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            console.log("Current Weather Data:", data); // Debug log
            if (data.error) {
                weatherDataDiv.innerHTML = `<p>Error: ${data.error}</p>`;
                hourlyDataDiv.innerHTML = "";
                weeklyDataDiv.innerHTML = "";
            } else {
                displayWeatherData(data);
            }
        })
        .catch((error) => {
            console.error("Error fetching weather data:", error);
            weatherDataDiv.innerHTML = `<p>Error fetching data. Please try again later.</p>`;
            hourlyDataDiv.innerHTML = "";
            weeklyDataDiv.innerHTML = "";
        });
}

// Fetch hourly forecast data
function fetchHourlyForecast(city) {
    const url = `/hourly_forecast?city=${encodeURIComponent(city)}&unit=${unit}`;
    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            console.log("Hourly Forecast Data:", data); // Debug log
            if (data.error) {
                hourlyDataDiv.innerHTML = `<p>Error: ${data.error}</p>`;
            } else if (Array.isArray(data)) {
                displayHourlyForecast(data);
            } else {
                console.error("Unexpected hourly forecast data format:", data);
                hourlyDataDiv.innerHTML = `<p>Error displaying hourly forecast. Check the console for details.</p>`;
            }
        })
        .catch((error) => {
            console.error("Error fetching hourly forecast:", error);
            hourlyDataDiv.innerHTML = `<p>Error fetching data. Please try again later.</p>`;
        });
}

// Fetch weekly forecast data
function fetchWeeklyForecast(city) {
    const url = `/weekly_forecast?city=${encodeURIComponent(city)}&unit=${unit}`;
    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            console.log("Weekly Forecast Data:", data); // Debug log
            if (data.error) {
                weeklyDataDiv.innerHTML = `<p>Error: ${data.error}</p>`;
            } else if (Array.isArray(data)) {
                displayWeeklyForecast(data);
            } else {
                console.error("Unexpected weekly forecast data format:", data);
                weeklyDataDiv.innerHTML = `<p>Error displaying weekly forecast. Check the console for details.</p>`;
            }
        })
        .catch((error) => {
            console.error("Error fetching weekly forecast:", error);
            weeklyDataDiv.innerHTML = `<p>Error fetching data. Please try again later.</p>`;
        });
}

// Display hourly forecast
function displayHourlyForecast(data) {
    hourlyDataDiv.innerHTML = `<div class="hourly-container">`;
    data.forEach((hour) => {
        const iconUrl = hour.condition.icon.startsWith("http") ? hour.condition.icon : `https:${hour.condition.icon}`;
        let temperature = unit === "metric" ? hour.temp_c : convertToFahrenheit(hour.temp_c);
        temperature = roundTemperature(temperature); // Round temperature

        hourlyDataDiv.innerHTML += `
            <div class="forecast-tile">
                <h4>${new Date(hour.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</h4>
                <img src="${loadImageWithFallback(iconUrl, "https://www.weatherapi.com/favicon.ico")}" alt="${hour.condition.text}">
                <p><strong>${temperature}°</strong></p>
                <p>${hour.condition.text}</p>
            </div>
        `;
    });
    hourlyDataDiv.innerHTML += `</div>`;
}

// Display weekly forecast
function displayWeeklyForecast(data) {
    weeklyDataDiv.innerHTML = `<div class="weekly-container">`;
    data.forEach((day) => {
        const iconUrl = day.day.condition.icon.startsWith("http") ? day.day.condition.icon : `https:${day.day.condition.icon}`;
        let temperature = unit === "metric" ? day.day.avgtemp_c : day.day.avgtemp_f;
        temperature = roundTemperature(temperature); // Round temperature

        weeklyDataDiv.innerHTML += `
            <div class="forecast-tile">
                <h4>${new Date(day.date).toLocaleDateString()}</h4>
                <img src="${loadImageWithFallback(iconUrl, "https://www.weatherapi.com/favicon.ico")}" alt="${day.day.condition.text}">
                <p><strong>${temperature}°</strong></p>
                <p>${day.day.condition.text}</p>
            </div>
        `;
    });
    weeklyDataDiv.innerHTML += `</div>`;
}


// Convert Celsius to Fahrenheit
function convertToFahrenheit(celsius) {
    return (celsius * 9 / 5) + 32;
}

// Round temperature to 1 decimal place
function roundTemperature(temp) {
    return temp.toFixed(1);
}

// Display current weather data
function displayWeatherData(data) {
    const temperatureUnit = unit === "metric" ? "°C" : "°F";
    const windSpeedUnit = unit === "metric" ? "kph" : "mph";
    const iconUrl = data.current.condition.icon.startsWith("http") ? data.current.condition.icon : `https:${data.current.condition.icon}`;
    const fallbackIcon = "https://www.weatherapi.com/favicon.ico";

    let temperature = unit === "metric" ? data.current.temp_c : convertToFahrenheit(data.current.temp_c);
    temperature = roundTemperature(temperature); // Round temperature

    weatherDataDiv.innerHTML = `
        <div class="tile">
            <h3>${data.location.name}, ${data.location.country}</h3>
            <img src="${loadImageWithFallback(iconUrl, fallbackIcon)}" alt="${data.current.condition.text}">
            <p><strong>Temperature:</strong> ${temperature} ${temperatureUnit}</p>
            <p><strong>Weather:</strong> ${data.current.condition.text}</p>
            <p><strong>Humidity:</strong> ${data.current.humidity}%</p>
            <p><strong>Wind Speed:</strong> ${data.current.wind_kph} ${windSpeedUnit}</p>
        </div>
    `;
}

// Function to display weather in a tile [index.html]
function displayWeatherTile(city, data) {
    const temperatureUnit = unit === "metric" ? "°C" : "°F"; // Use the unit variable (metric or imperial)
    
    // Convert the temperature based on the selected unit
    let temperature = unit === "metric" ? data.current.temp_c : convertToFahrenheit(data.current.temp_c);
    temperature = roundTemperature(temperature); // Round to 1 decimal place

    const iconUrl = data.current.condition.icon.startsWith("http") ? data.current.condition.icon : `https:${data.current.condition.icon}`;
    
    weatherTilesDiv.innerHTML += `
        <div class="homepage-tile">
            <h3>${data.location.name}, ${data.location.country}</h3>
            <img src="${iconUrl}" alt="${data.current.condition.text}">
            <p><strong>${temperature} ${temperatureUnit}</strong></p>
            <p>${data.current.condition.text}</p>
        </div>
    `;
}


// Function to fetch weather data for a city [index.html]
function fetchWeatherDataForCity(city) {
    const url = `https://api.weatherapi.com/v1/current.json?key=${apiKey}&q=${encodeURIComponent(city)}&aqi=no`;
    fetch(url)
        .then(response => response.json())
        .then(data => displayWeatherTile(city, data))
        .catch(error => console.error("Error fetching weather data for city:", error));
}

// Function to get user's location and fetch nearby cities' weather data [index.html]
function getUserLocationAndFetchWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;
                
                // You can use reverse geocoding to find nearby cities, or just use a fixed set of cities near the location
                // For simplicity, let's use a few predefined cities nearby (you could extend this logic)
                const nearbyCities = ["Los Angeles", "San Francisco", "Chicago"];
                
                nearbyCities.forEach(city => fetchWeatherDataForCity(city));
            },
            (error) => {
                console.log("Unable to fetch your location. Using fallback cities.");
                fallbackCities.forEach(city => fetchWeatherDataForCity(city));
            }
        );
    } else {
        console.log("Geolocation is not supported by this browser. Using fallback cities.");
        fallbackCities.forEach(city => fetchWeatherDataForCity(city));
    }
}

// Call the function on page load to get the weather data for nearby cities or fallback cities
document.addEventListener("DOMContentLoaded", () => {
    getUserLocationAndFetchWeather();
});

// Function to create and display the country circles
function displayCountrySelector() {
    const countrySelector = document.getElementById("country-selector");

    countries.forEach((country) => {
        const countryCircle = document.createElement("div");
        countryCircle.classList.add("country-circle");
        countryCircle.innerText = country;

        // Add click event to redirect to the forecast page
        countryCircle.addEventListener("click", () => {
            // Redirect to the forecast page for the selected country
            localStorage.setItem("selectedCity", country);  // Store the selected country in localStorage
            window.location.href = "/forecast";  // Redirect to forecast page
        });

        countrySelector.appendChild(countryCircle);
    });
}

// Call the function to display the country selector on page load
document.addEventListener("DOMContentLoaded", () => {
    displayCountrySelector();
});
// Function to handle image loading with fallback
function loadImageWithFallback(src, fallbackSrc) {
    const img = new Image();
    img.src = src;
    img.onerror = () => {
        img.src = fallbackSrc; // Fallback image URL
    };
    return img.src;
}
