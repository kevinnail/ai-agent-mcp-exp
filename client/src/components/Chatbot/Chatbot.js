import React, { useRef, useState } from 'react';
import './Chatbot.css';
import { sendPrompt } from '../../services/fetch-llm.js';
import { toast } from 'react-toastify';
import WeatherDisplay from '../WeatherDisplay/WeatherDIsplay.js';

// Helper function to check if response contains weather data
function isWeatherResponse(text) {
  return (
    text.includes('Weather Forecast:') ||
    text.includes('Forecast for') ||
    text.includes('Weather Alerts:')
  );
}

function getToolUsageExamples(toolName) {
  const examples = {
    echo_message: ['Echo "Hello World"', 'Repeat "Testing" 3 times'],
    calculate: ['Calculate 15 + 27', 'What is 100 divided by 4?'],
    get_weather_for_city: [
      `What's the weather in New York?`,
      'Show me the forecast for Los Angeles',
    ],
    get_alerts: ['Show weather alerts for California', 'Get alerts for NY'],
  };
  return examples[toolName] || [];
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
                      {getToolUsageExamples(tool.name) && (
                        <div className="tool-usage">
                          <h4 className="usage-title">Usage Examples:</h4>
                          <ul className="usage-examples">
                            {getToolUsageExamples(tool.name).map(
                              (example, exIndex) => (
                                <li key={exIndex} className="usage-example">
                                  <code className="example-text">
                                    {example}
                                  </code>
                                </li>
                              )
                            )}
                          </ul>
                        </div>
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
