from flask import Flask, render_template, jsonify, request
import requests
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# WeatherAPI and NewsAPI keys
API_KEY = os.getenv("API_KEY", "6523be82bf3340bebe8164203240812")
NEWS_API_KEY = os.getenv("NEWS_API_KEY", "77793f9af3b34ef393749d7a295fe705")
BASE_URL = "https://api.weatherapi.com/v1/"
NEWS_API_URL = "https://newsapi.org/v2/everything?q=weather&apiKey="

@app.route("/")
def home():
    return render_template("index.html")
@app.route("/api/nearby_cities", methods=["GET"])
def get_nearby_cities():
    lat = request.args.get("lat")
    lon = request.args.get("lon")
    
    if not lat or not lon:
        return jsonify({"error": "Latitude and longitude are required"}), 400

    try:
        # Validate latitude and longitude as numbers within valid ranges
        lat = float(lat)
        lon = float(lon)
        if not (-90 <= lat <= 90) or not (-180 <= lon <= 180):
            return jsonify({"error": "Invalid latitude or longitude values"}), 400

        # Make the request to the external API to fetch nearby cities
        response = requests.get(
            f"{BASE_URL}search.json",
            params={"key": API_KEY, "q": f"{lat},{lon}"}
        )

        # Check if the request was successful
        if response.status_code != 200:
            return jsonify({"error": "Failed to fetch nearby cities"}), 500

        data = response.json()

        # Check if the response contains expected data structure
        if not isinstance(data, list):
            return jsonify({"error": "Unexpected response format from external API"}), 500

        # Extract the first 3 cities or fewer if not available
        cities = [{"name": city["name"], "lat": city["lat"], "lon": city["lon"]} for city in data]

        # If there are fewer than 3 cities, add fallback cities
        fallback_cities = [
            {"name": "San Francisco", "lat": 37.7749, "lon": -122.4194},
            {"name": "San Diego", "lat": 32.7157, "lon": -117.1611},
            {"name": "Los Angeles", "lat": 34.0522, "lon": -118.2437}
        ]

        # Fill the remaining spots with fallback cities if necessary
        while len(cities) < 3:
            cities.append(fallback_cities[len(cities)])

        return jsonify(cities[:3])  # Return the first 3 cities

    except ValueError:
        return jsonify({"error": "Latitude and longitude must be valid numbers"}), 400
    except requests.exceptions.RequestException as e:
        # Handle network or request errors
        return jsonify({"error": str(e)}), 500


@app.route("/forecast")
def forecast():
    return render_template("forecast.html")

@app.route("/radar")
def radar():
    return render_template("radar.html")

@app.route("/news")
def news():
    try:
        # Construct the URL to fetch news from the News API
        url = f"{NEWS_API_URL}{NEWS_API_KEY}"
        response = requests.get(url)
        data = response.json()

        # Check if the response contains articles and process them
        if response.status_code == 200 and "articles" in data:
            articles = [
                article for article in data["articles"]
                if article.get("title") and article.get("urlToImage") and article.get("url")
            ]
            return render_template("news.html", articles=articles)
        else:
            # Handle error responses from the News API
            error_message = data.get("message", "Error fetching news")
            return render_template("news.html", error=error_message)
    except requests.RequestException as e:
        # Handle network errors
        return render_template("news.html", error="Network error: Unable to fetch news.")
    except Exception as e:
        # Catch-all for any unexpected errors
        return render_template("news.html", error=f"An unexpected error occurred: {str(e)}")


@app.route("/current_weather", methods=["GET"])
def get_current_weather():
    city = request.args.get("city", "New York")  # Default to New York
    try:
        url = f"{BASE_URL}current.json?key={API_KEY}&q={city}&aqi=no"
        response = requests.get(url)
        data = response.json()

        if response.status_code == 200 and "current" in data:
            return jsonify(data)
        else:
            error_message = data.get("error", {}).get("message", "Error fetching weather data")
            return jsonify({"error": error_message}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/hourly_forecast", methods=["GET"])
def get_hourly_forecast():
    city = request.args.get("city", "New York")
    try:
        url = f"{BASE_URL}forecast.json?key={API_KEY}&q={city}&days=1&aqi=no"
        response = requests.get(url)
        data = response.json()

        if response.status_code == 200 and "forecast" in data:
            hourly_data = data["forecast"]["forecastday"][0]["hour"]
            return jsonify(hourly_data)
        else:
            error_message = data.get("error", {}).get("message", "Error fetching hourly forecast")
            return jsonify({"error": error_message}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/weekly_forecast", methods=["GET"])
def get_weekly_forecast():
    city = request.args.get("city", "New York")
    try:
        url = f"{BASE_URL}forecast.json?key={API_KEY}&q={city}&days=7&aqi=no"
        response = requests.get(url)
        data = response.json()

        if response.status_code == 200 and "forecast" in data:
            return jsonify(data["forecast"]["forecastday"])
        else:
            error_message = data.get("error", {}).get("message", "Error fetching weekly forecast")
            return jsonify({"error": error_message}), response.status_code
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True)
