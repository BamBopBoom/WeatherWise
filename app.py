from flask import Flask, render_template, jsonify, request
import requests

app = Flask(__name__)

API_KEY = "f5807df07b91404b8a2180331242411"  # Replace with your WeatherAPI.com API key
BASE_URL = "https://api.weatherapi.com/v1/"

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
    return render_template("news.html")

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