import React, { useEffect, useState } from 'react';
import './weatherWidget.css';

const currentDate = new Date();
const futureDates = [...Array(7)].map((_, index) => {
  const date = new Date();
  date.setDate(currentDate.getDate() + index);
  return date;
});
const dayAbbreviations = futureDates.map((date) => ({
  abbreviation: date.toLocaleDateString('en-US', { weekday: 'short' }),
  full: date.toLocaleDateString('en-US', { weekday: 'long' }),
}));

const WeatherWidget = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [isMinimized, setIsMinimized] = useState(true); // Track if the widget is minimized

  const API_KEY = 'INSERT API KEY HERE';
  const [selectedDayIndex, setSelectedDayIndex] = useState(null);
  const [dragging, setDragging] = useState(false); // Track if the details window is being dragged
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); // Track the offset of the details window when dragging starts
  const [windowPosition, setWindowPosition] = useState({ x: 0, y: 0 }); // Track the position of the details window

  const handleDayClick = (index) => {
    setSelectedDayIndex(index);
  };

  useEffect(() => {
    // Fetch weather data based on user's location
    const fetchWeatherData = async () => {
      try {
        const response = await fetch(
          `https://api.weatherapi.com/v1/forecast.json?key=${API_KEY}&q=auto:ip&days=7`
        );
        const data = await response.json();
        setWeatherData(data);
      } catch (error) {
        console.log('Error fetching weather data:', error);
      }
    };

    fetchWeatherData();
  }, []);

  const temperatures = weatherData?.forecast?.forecastday.map(
    (forecastDay) => forecastDay.day.avgtemp_f
  );

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const handleDragStart = (event) => {
    setDragging(true);
    setDragOffset({
      x: event.clientX - windowPosition.x,
      y: event.clientY - windowPosition.y,
    });
  };

  const handleDragEnd = () => {
    setDragging(false);
  };

  const handleDrag= (event) => {
    if (dragging) {
      const newX = event.clientX - dragOffset.x;
      const newY = event.clientY - dragOffset.y;
  
      // Restrict the window within the widget boundaries
      const widgetBounds = document
        .querySelector('.weather-widget')
        .getBoundingClientRect();
      const windowBounds = document
        .querySelector('.detailed-weather')
        .getBoundingClientRect();
  
      const minX = widgetBounds.left - 71; // Adjust the horizontal boundary by shifting it 125px to the left
      const maxX = widgetBounds.right - windowBounds.width - 71; // Adjust the horizontal boundary by shifting it 125px to the left
      const minY = widgetBounds.top - 28; // Adjust the vertical boundary by shifting it 125px up
      const maxY = widgetBounds.bottom - windowBounds.height - 28; // Adjust the vertical boundary by shifting it 125px up
  
      const clampedX = Math.min(Math.max(newX, minX), maxX);
      const clampedY = Math.min(Math.max(newY, minY), maxY);
  
      setWindowPosition({ x: clampedX, y: clampedY });
    }
  };
    

  const getDewPoint = (selectedDayIndex) => {
    const hourlyData = weatherData.forecast.forecastday[selectedDayIndex].hour;
    const averageDewPoint =
      hourlyData.reduce((sum, hour) => sum + hour.dewpoint_f, 0) / hourlyData.length;
    return Math.round(averageDewPoint);
  };

  const renderMinimized = () => {
    const currentDayAbbreviation = dayAbbreviations[0].abbreviation; // Get the abbreviation of the current day

    if (!weatherData) {
      return null; // Return null or a loading state if weatherData is not available yet
    }

    return (
      <div>
        <div className="mini-widget" onClick={toggleMinimize}>
          <p className="day">{currentDayAbbreviation}</p>
          <p className="temp">{temperatures[0]}°F</p> {/* Display today's temperature */}
        </div>
      </div>
    );
  };

  const renderFullWidget = () => {
    // Determine if it's currently day or night locally
    const isDayTime = () => {
      const currentHour = new Date().getHours();
      return currentHour >= 6 && currentHour < 18; // Assumes 6 AM to 6 PM is considered day time
    };

    // Set the background image based on day or night
    const backgroundImage = isDayTime() ? 'day.jpg' : 'night.jpg';

    // Determine the text color based on the background image
    const textColor = isDayTime() ? '#193b1e' : '#e4f0df';

    return (
      <div className="weather-widget" style={{ backgroundImage: `url(/${backgroundImage})` }}>
        {weatherData ? (
          <div className="container">
            <div className="title-container">
              <h2 className="title" style={{ color: textColor }}>Current Weather Conditions</h2>
              <p onClick={toggleMinimize} className="minimize" style={{ color: textColor }}>⇠</p>
            </div>
            <h2 className="location" style={{ color: textColor }}>
              {weatherData.location.name},{' '}
              {weatherData.location.region || weatherData.location.country}
            </h2>
            <div className="cond-container">
              <p className="condition">
                Temperature: {weatherData.current.temp_f}°F / {weatherData.current.temp_c}°C
              </p>
              <p className="condition">Condition: {weatherData.current.condition.text}</p>
              <p className="condition">Humidity: {weatherData.current.humidity}%</p>
            </div>
            <div className="bottom-container">
              <h3 className="week" style={{ color: textColor }}>7 Day Averages</h3>
              <div className="future-container">
                {temperatures.map((temperature, index) => (
                  <div className="future" key={index} onClick={() => handleDayClick(index)}>
                    <p className="day">{dayAbbreviations[index].abbreviation}</p>
                    <p className="temp">{temperature}°F</p>
                  </div>
                ))}
              </div>
            </div>
            {selectedDayIndex !== null && (
              <div
                className="detailed-weather"
                style={{ left: windowPosition.x, top: windowPosition.y }}
                onMouseDown={handleDragStart}
                onMouseUp={handleDragEnd}
                onMouseMove={handleDrag}
              >
                <div className="close-button" onClick={() => setSelectedDayIndex(null)}>
                  <p>X</p>
                </div>
                <h3>{dayAbbreviations[selectedDayIndex].full}</h3>
                <div>
                  <p className="details">
                    High: {weatherData.forecast.forecastday[selectedDayIndex].day.maxtemp_f}°F
                  </p>
                  <p className="details">
                    Low: {weatherData.forecast.forecastday[selectedDayIndex].day.mintemp_f}°F
                  </p>
                  <p className="details">
                    UV Index: {weatherData.forecast.forecastday[selectedDayIndex].day.uv}
                  </p>
                  <p className="details">
                    Chance of Rain:{' '}
                    {weatherData.forecast.forecastday[selectedDayIndex].day.daily_chance_of_rain}%
                  </p>
                  <p className="details">Dew Point: {getDewPoint(selectedDayIndex)}°F</p>
                  <p className="details">
                    Wind Speed: {weatherData.forecast.forecastday[selectedDayIndex].day.maxwind_mph} mph
                  </p>
                  <p className="details">
                    Sunrise: {weatherData.forecast.forecastday[selectedDayIndex].astro.sunrise}
                  </p>
                  <p className="details">
                    Sunset: {weatherData.forecast.forecastday[selectedDayIndex].astro.sunset}
                  </p>
                  <p className="details">
                    Moonrise: {weatherData.forecast.forecastday[selectedDayIndex].astro.moonrise}
                  </p>
                  <p className="details">
                    Moonset: {weatherData.forecast.forecastday[selectedDayIndex].astro.moonset}
                  </p>
                  <p className="details">
                    Moon Phase: {weatherData.forecast.forecastday[selectedDayIndex].astro.moon_phase}
                  </p>
                  <p className="details">
                    Moon Illumination:{' '}
                    {weatherData.forecast.forecastday[selectedDayIndex].astro.moon_illumination}%
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="loading">Loading weather data...</p>
        )}
      </div>
    );
  };

  return (
    <div className="widget-wrapper">
      {isMinimized ? renderMinimized() : renderFullWidget()}
    </div>
  );
};

export default WeatherWidget;






