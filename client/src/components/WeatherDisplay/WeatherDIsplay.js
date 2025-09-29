// Weather Display Component
export default function WeatherDisplay({ response }) {
  const weatherData = parseWeatherData(response);
  // Helper function to parse weather data from response
  function parseWeatherData(text) {
    const lines = text.split('\n');
    const weatherData = {
      location: '',
      forecast: [],
      alerts: [],
    };

    let currentSection = '';
    let currentPeriod = null;
    let currentAlert = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines and separators
      if (!line || line === '---') continue;

      // Detect sections
      if (line.includes('Forecast for')) {
        weatherData.location = line
          .replace('Forecast for ', '')
          .replace(':', '');
        currentSection = 'forecast';
        continue;
      }

      if (line.includes('Weather Alerts:')) {
        currentSection = 'alerts';
        continue;
      }

      if (line.includes('No active weather alerts')) {
        currentSection = 'alerts';
        continue;
      }

      // Parse forecast periods
      if (currentSection === 'forecast') {
        if (
          line.includes(':') &&
          !line.includes('Temperature:') &&
          !line.includes('Wind:')
        ) {
          // This is a period name
          if (currentPeriod) {
            weatherData.forecast.push(currentPeriod);
          }
          currentPeriod = {
            name: line.replace(':', ''),
            temperature: '',
            wind: '',
            forecast: '',
          };
        } else if (line.includes('Temperature:')) {
          if (currentPeriod) {
            currentPeriod.temperature = line.replace('Temperature: ', '');
          }
        } else if (line.includes('Wind:')) {
          if (currentPeriod) {
            currentPeriod.wind = line.replace('Wind: ', '');
          }
        } else if (
          currentPeriod &&
          !line.includes('Temperature:') &&
          !line.includes('Wind:')
        ) {
          // This is the forecast description
          currentPeriod.forecast = line;
        }
      }

      // Parse alerts
      if (currentSection === 'alerts') {
        if (line.includes('Event:')) {
          if (currentAlert) {
            weatherData.alerts.push(currentAlert);
          }
          currentAlert = {
            event: line.replace('Event: ', ''),
            area: '',
            severity: '',
            status: '',
            headline: '',
          };
        } else if (line.includes('Area:')) {
          if (currentAlert) {
            currentAlert.area = line.replace('Area: ', '');
          }
        } else if (line.includes('Severity:')) {
          if (currentAlert) {
            currentAlert.severity = line.replace('Severity: ', '');
          }
        } else if (line.includes('Status:')) {
          if (currentAlert) {
            currentAlert.status = line.replace('Status: ', '');
          }
        } else if (line.includes('Headline:')) {
          if (currentAlert) {
            currentAlert.headline = line.replace('Headline: ', '');
          }
        }
      }
    }

    // Add the last period and alert if they exist
    if (currentPeriod) {
      weatherData.forecast.push(currentPeriod);
    }
    if (currentAlert) {
      weatherData.alerts.push(currentAlert);
    }

    return weatherData;
  }

  // Helper function to get weather icon based on forecast description
  function getWeatherIcon(forecast) {
    const desc = forecast.toLowerCase();

    if (desc.includes('sunny') || desc.includes('clear')) {
      return '☀️';
    } else if (
      desc.includes('partly cloudy') ||
      desc.includes('partly sunny')
    ) {
      return '⛅';
    } else if (desc.includes('cloudy') || desc.includes('overcast')) {
      return '☁️';
    } else if (
      desc.includes('thunderstorm') ||
      desc.includes('thunderstorms')
    ) {
      return '⛈️';
    } else if (desc.includes('shower') || desc.includes('showers')) {
      return '🌧️';
    } else if (desc.includes('rain') || desc.includes('drizzle')) {
      return '🌦️';
    } else if (desc.includes('storm') || desc.includes('thunder')) {
      return '⛈️';
    } else if (desc.includes('snow') || desc.includes('sleet')) {
      return '❄️';
    } else if (desc.includes('fog') || desc.includes('mist')) {
      return '🌫️';
    } else if (desc.includes('wind')) {
      return '💨';
    } else if (desc.includes('hot') || desc.includes('warm')) {
      return '🌡️';
    } else if (desc.includes('cold') || desc.includes('freezing')) {
      return '🧊';
    } else {
      return '🌤️'; // Default weather icon
    }
  }
  // Group forecast data into day/night pairs
  const groupedForecast = [];
  for (let i = 0; i < weatherData.forecast.length; i += 2) {
    if (i + 1 < weatherData.forecast.length) {
      groupedForecast.push({
        day: weatherData.forecast[i],
        night: weatherData.forecast[i + 1],
      });
    } else {
      // If odd number of periods, just add the last one
      groupedForecast.push({
        day: weatherData.forecast[i],
        night: null,
      });
    }
  }

  return (
    <div className="weather-display">
      {weatherData.location && (
        <div className="weather-location">
          <h4>{weatherData.location}</h4>
        </div>
      )}

      {groupedForecast.length > 0 && (
        <div className="weather-forecast-section">
          <h5>🌤️ Forecast</h5>
          <div className="forecast-cards">
            {groupedForecast.map((dayGroup, index) => (
              <div key={index} className="forecast-day-group">
                {/* Day card */}
                <div className="forecast-card forecast-day">
                  <div className="forecast-header">
                    <div className="forecast-period">{dayGroup.day.name}</div>
                    <div className="forecast-icon">
                      {getWeatherIcon(dayGroup.day.forecast)}
                    </div>
                  </div>
                  <div className="forecast-temp">
                    {dayGroup.day.temperature}
                  </div>
                  <div className="forecast-wind">{dayGroup.day.wind}</div>
                  <div className="forecast-desc">{dayGroup.day.forecast}</div>
                </div>

                {/* Night card */}
                {dayGroup.night && (
                  <div className="forecast-card forecast-night">
                    <div className="forecast-header">
                      <div className="forecast-period">
                        {dayGroup.night.name}
                      </div>
                      <div className="forecast-icon">
                        {getWeatherIcon(dayGroup.night.forecast)}
                      </div>
                    </div>
                    <div className="forecast-temp">
                      {dayGroup.night.temperature}
                    </div>
                    <div className="forecast-wind">{dayGroup.night.wind}</div>
                    <div className="forecast-desc">
                      {dayGroup.night.forecast}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {weatherData.alerts.length > 0 && (
        <div className="weather-alerts-section">
          <h5>⚠️ Weather Alerts</h5>
          <div className="alert-cards">
            {weatherData.alerts.map((alert, index) => (
              <div
                key={index}
                className={`alert-card alert-${alert.severity?.toLowerCase() || 'unknown'}`}
              >
                <div className="alert-event">{alert.event}</div>
                <div className="alert-area">{alert.area}</div>
                <div className="alert-severity">Severity: {alert.severity}</div>
                <div className="alert-status">Status: {alert.status}</div>
                {alert.headline && (
                  <div className="alert-headline">{alert.headline}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {weatherData.alerts.length === 0 &&
        response.includes('No active weather alerts') && (
          <div className="weather-alerts-section">
            <h5>⚠️ Weather Alerts</h5>
            <div className="no-alerts">No active weather alerts</div>
          </div>
        )}
    </div>
  );
}
