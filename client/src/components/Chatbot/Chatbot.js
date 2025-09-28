import React, { useRef, useState } from 'react';
import './Chatbot.css';
import { sendPrompt } from '../../services/fetch-llm.js';

export default function Chatbot() {
  const textareaRef = useRef(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSend(e) {
    e.preventDefault();
    if (!input.trim()) return;

    console.log('hello?');
    setLoading(true);
    try {
      await sendPrompt(input);
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

  return (
    <div className="chatbot">
      <form className="chatbot-form" onSubmit={handleSend}>
        <p>
          This is a chatbot. that is purely for demonstrating how it can access
          tools via and MCP Server using HTTP SSE for streaming
          responses.asdfasdfasfsadf
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
      </form>
    </div>
  );
}
