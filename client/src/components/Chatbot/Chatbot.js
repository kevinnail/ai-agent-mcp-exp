import React, { useRef, useState } from 'react';
import './Chatbot.css';
import { sendPrompt } from '../../services/fetch-llm.js';
import { toast } from 'react-toastify';

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
      weatherData.location = line.replace('Forecast for ', '').replace(':', '');
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

// Helper function to check if response contains weather data
function isWeatherResponse(text) {
  return (
    text.includes('Weather Forecast:') ||
    text.includes('Forecast for') ||
    text.includes('Weather Alerts:')
  );
}

// Helper function to get weather icon based on forecast description
function getWeatherIcon(forecast) {
  const desc = forecast.toLowerCase();

  if (desc.includes('sunny') || desc.includes('clear')) {
    return '☀️';
  } else if (desc.includes('partly cloudy') || desc.includes('partly sunny')) {
    return '⛅';
  } else if (desc.includes('cloudy') || desc.includes('overcast')) {
    return '☁️';
  } else if (desc.includes('thunderstorm') || desc.includes('thunderstorms')) {
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

// Weather Display Component
function WeatherDisplay({ response }) {
  const weatherData = parseWeatherData(response);

  return (
    <div className="weather-display">
      {weatherData.location && (
        <div className="weather-location">
          <h4>📍 {weatherData.location}</h4>
        </div>
      )}

      {weatherData.forecast.length > 0 && (
        <div className="weather-forecast-section">
          <h5>🌤️ Forecast</h5>
          <div className="forecast-cards">
            {weatherData.forecast.map((period, index) => (
              <div key={index} className="forecast-card">
                <div className="forecast-header">
                  <div className="forecast-period">{period.name}</div>
                  <div className="forecast-icon">
                    {getWeatherIcon(period.forecast)}
                  </div>
                </div>
                <div className="forecast-temp">{period.temperature}</div>
                <div className="forecast-wind">{period.wind}</div>
                <div className="forecast-desc">{period.forecast}</div>
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

const BASE_URL = process.env.REACT_APP_BASE_URL || '';

export default function Chatbot() {
  const textareaRef = useRef(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatReply, setChatReply] = useState('');
  const [showToolsPopup, setShowToolsPopup] = useState(false);
  const [tools, setTools] = useState([]);
  const [toolsLoading, setToolsLoading] = useState(false);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;

    setLoading(true);
    try {
      const response = await sendPrompt(input);

      if (response.message) {
        setChatReply(response.message);
      } else {
        throw new Error('Failed to send prompt');
      }
      setInput('');
    } catch (error) {
      console.error('Error sending prompt:', error);
    } finally {
      setLoading(false);
    }
  }

  function onInputChange(e) {
    const newInput = e.target.value;
    setInput(newInput);
  }

  // Auto-resize textarea based on content
  const handleTextareaChange = (e) => {
    onInputChange(e);

    // Auto-resize after input change
    const textarea = e.target;
    const oldHeight = textarea.offsetHeight;
    textarea.style.height = 'auto';
    const newHeight = textarea.scrollHeight;
    textarea.style.height = `${newHeight}px`;

    // If textarea grew, scroll down by the exact amount it expanded
    // This keeps the textarea in the same position relative to viewport
    // and prevents the "scroll to bottom" button from appearing
    if (newHeight > oldHeight) {
      window.scrollBy(0, newHeight - oldHeight);
    }
  };
  async function handleToolsClick() {
    setToolsLoading(true);
    try {
      const response = await fetch(`${BASE_URL}/api/v1/chatbot/tools`);
      const data = await response.json();
      setTools(data || []);
      setShowToolsPopup(true);
    } catch (error) {
      console.error('Error fetching tools:', error);
      toast.error('Failed to load tools');
    } finally {
      setToolsLoading(false);
    }
  }

  function closeToolsPopup() {
    setShowToolsPopup(false);
  }

  return (
    <div className="chatbot">
      <form className="chatbot-form" onSubmit={handleSend}>
        <p>
          Want to see what tools this chatbot has available?{' '}
          <span
            style={{ cursor: 'pointer', textDecoration: 'underline' }}
            onClick={handleToolsClick}
          >
            {toolsLoading ? 'Loading...' : 'Click here'}
          </span>
        </p>
        <textarea
          ref={textareaRef}
          className="message-input"
          style={{
            display: loading ? 'none' : 'block',
          }}
          value={input}
          placeholder={'Ask me anything'}
          disabled={loading}
          onChange={handleTextareaChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
            // If Shift+Enter is pressed, allow default behavior (new line)
          }}
        />
        <button className="ask-button" type="submit">
          Ask
        </button>
      </form>{' '}
      {chatReply && (
        <div className="response-container">
          <div className="response-header">
            <h3>AI Response</h3>
          </div>
          <div className="response-content">
            {isWeatherResponse(chatReply) ? (
              <WeatherDisplay response={chatReply} />
            ) : (
              <div className="response-text">
                {chatReply.split('\n').map((line, index) => (
                  <>
                    {' '}
                    <span key={index}>{line}</span>
                    <br />
                  </>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      {/* Tools Popup */}
      {showToolsPopup && (
        <div className="tools-popup-overlay" onClick={closeToolsPopup}>
          <div className="tools-popup" onClick={(e) => e.stopPropagation()}>
            <div className="tools-popup-header">
              <h3>Available Tools</h3>
              <button className="tools-popup-close" onClick={closeToolsPopup}>
                ×
              </button>
            </div>
            <div className="tools-popup-content">
              {tools.length > 0 ? (
                <ul className="tools-list">
                  {tools.map((tool, index) => (
                    <li key={index} className="tool-item">
                      <span className="tool-name">{tool.name}</span>
                      {tool.description && (
                        <p className="tool-description">{tool.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="no-tools">No tools available</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
