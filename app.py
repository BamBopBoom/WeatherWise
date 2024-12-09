from flask import Flask, render_template, jsonify, request
import requests

app = Flask(__name__)

API_KEY = "6523be82bf3340bebe8164203240812"  # Replace with your WeatherAPI.com API key
NEWS_API_KEY = "77793f9af3b34ef393749d7a295fe705"  # Replace with your NewsAPI key
BASE_URL = "https://api.weatherapi.com/v1/"
NEWS_API_URL = "https://newsapi.org/v2/everything?q=weather&apiKey="  # Base URL for NewsAPI


@app.route("/")
def home():
    return render_template("index.html")

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
        # Construct the API request URL
        url = f"{BASE_URL}current.json?key={API_KEY}&q={city}&aqi=no"
        response = requests.get(url)
        data = response.json()

        # Check if the response is successful and contains weather data
        if response.status_code == 200 and "current" in data:
            # Extract location information
            location_data = {
                "name": data["location"]["name"],
                "state": data["location"].get("region", ""),  # 'region' is typically the state
                "country": data["location"]["country"]
            }
            # Include the location and current weather in the response
            return jsonify({
                "location": location_data,
                "current": data["current"]
            })
        else:
            # Handle API errors gracefully
            error_message = data.get("error", {}).get("message", "Error fetching weather data")
            return jsonify({"error": error_message}), response.status_code
    except Exception as e:
        # Handle unexpected exceptions
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
