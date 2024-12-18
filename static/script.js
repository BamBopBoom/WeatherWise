
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
    // Check if we are on the forecast page
    if (window.location.pathname === "/forecast") {
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

//Clock Section
function updateClock() {
    const clockElement = document.getElementById("clock");

    // Get the current date and time
    const now = new Date();

    // Format hours, minutes, and seconds for 12-hour clock
    let hours = now.getHours();
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    // Determine AM or PM
    const amPm = hours >= 12 ? 'PM' : 'AM';

    // Convert to 12-hour format
    hours = hours % 12 || 12;

    // Update the clock with the current time
    clockElement.textContent = `${hours}:${minutes}:${seconds} ${amPm}`;
}

// Update the clock every second
setInterval(updateClock, 1000);

// Initialize the clock immediately on page load
updateClock();



// Event listener for the search button
searchButton.addEventListener("click", async () => {
    const city = cityInput.value.trim();

    if (!city) {
        // If city input is empty, get user location
        getUserLocation();
        return;
    }

    // Save city in localStorage only if it's different from the last saved city
    const previousCity = localStorage.getItem("selectedCity");
    if (city !== previousCity) {
        localStorage.setItem("selectedCity", city);
    }

    if (window.location.pathname === "/forecast") {
        try {
            // If already on forecast page, fetch data directly
            await fetchWeatherData(city);
            await fetchHourlyForecast(city);
            await fetchWeeklyForecast(city);
        } catch (error) {
            console.error("Error fetching weather data:", error);
            // Display user-friendly message if fetching fails
            alert("Sorry, there was an issue fetching weather data. Please try again later.");
        }
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
    // Get the current time
    const currentTime = new Date();
    
    // Filter out past hours from the forecast data
    const futureData = data.filter(hour => {
        const forecastTime = new Date(hour.time);
        return forecastTime >= currentTime; // Only include future hours
    });

    hourlyDataDiv.innerHTML = `<div class="hourly-container">`;

    futureData.forEach((hour) => {
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
    // Get the current date
    const today = new Date();

    // Sort the data to start from the current day and include today
    const sortedData = data.sort((a, b) => new Date(a.date) - new Date(b.date))
        .filter(day => new Date(day.date).setHours(0, 0, 0, 0) >= today.setHours(0, 0, 0, 0)); // Include today

    // Clear and start creating the weekly forecast container
    weeklyDataDiv.innerHTML = `<div class="weekly-container">`;

    // Loop through the sorted data
    sortedData.forEach((day) => {
        const iconUrl = day.day.condition.icon.startsWith("http") ? day.day.condition.icon : `https:${day.day.condition.icon}`;
        let temperature = unit === "metric" ? day.day.avgtemp_c : day.day.avgtemp_f;
        temperature = roundTemperature(temperature); // Round temperature

        // Add each day's forecast as a tile
        weeklyDataDiv.innerHTML += `
            <div class="forecast-tile">
                <h4>${new Date(day.date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</h4>
                <img src="${loadImageWithFallback(iconUrl, "https://www.weatherapi.com/favicon.ico")}" alt="${day.day.condition.text}">
                <p><strong>${temperature}°</strong></p>
                <p>${day.day.condition.text}</p>
            </div>
        `;
    });

    // Close the container
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
    const state = data.location.region || "N/A"; // Use region if state is undefined
    const locationName = `${data.location.name}, ${state}`;
    const iconUrl = data.current.condition.icon.startsWith("http") ? data.current.condition.icon : `https:${data.current.condition.icon}`;
    const fallbackIcon = "https://www.weatherapi.com/favicon.ico";

    let temperature = unit === "metric" ? data.current.temp_c : convertToFahrenheit(data.current.temp_c);
    temperature = roundTemperature(temperature); // Round temperature

    // Determine the location string (City, State for USA; City only otherwise)
    weatherDataDiv.innerHTML = `
        <div class="tile">
            <h5>${locationName}</h5>
            <h6>${data.location.country}</h6>
            <div class="icon-box">
                <img src="${loadImageWithFallback(iconUrl, fallbackIcon)}" alt="${data.current.condition.text}">
            </div>
            <div class="weather-details">
                <div class="detail-box">
                    <p><strong>Temperature:</strong></p>
                    <p>${temperature} ${temperatureUnit}</p>
                </div>
                <div class="detail-box">
                    <p><strong>Weather:</strong></p>
                    <p>${data.current.condition.text}</p>
                </div>
                <div class="detail-box">
                    <p><strong>Humidity:</strong></p>
                    <p>${data.current.humidity}%</p>
                </div>
                <div class="detail-box">
                    <p><strong>Wind Speed:</strong></p>
                    <p>${data.current.wind_kph} ${windSpeedUnit}</p>
                </div>
            </div>
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



// Function to get user's location and fetch nearby cities' weather data
// Fetch nearby cities and their weather data
async function fetchNearbyCities(lat, lon) {
    const url = `/api/nearby_cities?lat=${lat}&lon=${lon}`;
    try {
        const response = await fetch(url);
        const cities = await response.json();

        // Debug: Log the fetched cities
        console.log("Nearby cities:", cities);

        if (!Array.isArray(cities) || cities.length === 0) {
            throw new Error("No nearby cities found");
        }

        // Fetch weather for the first 3 cities
        const nearbyCities = cities.slice(0, 3);
        console.log("Fetching weather for cities:", nearbyCities);
        nearbyCities.forEach((city) => fetchWeatherDataForCity(city.name));
    } catch (error) {
        console.error("Error fetching nearby cities:", error);
    }
}

// Fetch weather data for a specific city and render its tile
function fetchWeatherDataForCity(city) {
    const url = `/current_weather?city=${encodeURIComponent(city)}`;

    fetch(url)
        .then((response) => response.json())
        .then((data) => {
            if (data.error) {
                console.error(`Error fetching weather data for ${city}:`, data.error);
                return;
            }

            // Debug: Log the weather data
            console.log(`Weather data for ${city}:`, data);

            const country = data.location.country;
            const isImperial =
                country === "United States" || country === "United States of America";
            const temperature = isImperial ? data.current.temp_f : data.current.temp_c;
            const temperatureUnit = isImperial ? "°F" : "°C";

            const iconUrl = data.current.condition.icon.startsWith("http")
                ? data.current.condition.icon
                : `https:${data.current.condition.icon}`;

            // Append the tile to the weatherTilesDiv
            const weatherTilesDiv = document.getElementById("nearby-weather-tiles");
            weatherTilesDiv.innerHTML += `
                <div class="homepage-tile" onclick="redirectToForecast('${city}')">
                    <h3>${data.location.name}, ${data.location.country}</h3>
                    <img src="${iconUrl}" alt="${data.current.condition.text}">
                    <p><strong>${temperature} ${temperatureUnit}</strong></p>
                    <p>${data.current.condition.text}</p>
                </div>
            `;

            // Debug: Log tile creation
            console.log(`Tile created for: ${city}`);
        })
        .catch((error) => console.error(`Error fetching weather data:`, error));
}

// Redirect to forecast page
function redirectToForecast(city) {
    localStorage.setItem("selectedCity", city);
    window.location.href = "/forecast";
}

// Get user's location and fetch weather for nearby cities
function getUserLocationAndFetchWeather() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                // Debug: Log the user's location
                console.log(`User's location: Latitude ${lat}, Longitude ${lon}`);

                fetchNearbyCities(lat, lon);
            },
            (error) => {
                console.error("Unable to fetch your location. Using fallback cities.", error);

                // Use fallback cities if location is unavailable
                const fallbackCities = ["San Francisco", "San Diego", "Los Angeles"];
                fallbackCities.forEach((city) => fetchWeatherDataForCity(city));
            }
        );
    } else {
        console.error("Geolocation is not supported by this browser.");
    }
}

// Initialize weather tiles
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


//function to load news
document.addEventListener("DOMContentLoaded", () => {
    const newsContainer = document.getElementById("news-list");

    const NEWS_API_URL = `https://newsapi.org/v2/everything?q=weather&apiKey=YOUR_API_KEY`;

    fetch(NEWS_API_URL)
        .then(response => {
            if (!response.ok) {
                throw new Error(`Failed to fetch news: ${response.statusText}`);
            }
            return response.json();
        })
        .then(data => {
            displayNews(data.articles);
        })
        .catch(error => {
            console.error(error);
            newsContainer.innerHTML = `<p>Unable to load news at the moment. Please try again later.</p>`;
        });

    function displayNews(articles) {
        if (!articles || articles.length === 0) {
            newsContainer.innerHTML = `<p>No news articles found.</p>`;
            return;
        }

        newsContainer.innerHTML = ""; // Clear any placeholder text
        articles.forEach(article => {
            if (!article.urlToImage || !article.url) return; // Skip if missing an image or link

            // Create clickable tile
            const newsTile = document.createElement("a");
            newsTile.className = "news-tile";
            newsTile.href = article.url;
            newsTile.target = "_blank"; // Open link in a new tab
            newsTile.innerHTML = `
                <img src="${article.urlToImage}" alt="News Image">
            `;

            newsContainer.appendChild(newsTile);
        });
    }
});