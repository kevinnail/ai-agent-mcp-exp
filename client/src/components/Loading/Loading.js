import React from 'react';
import './Loading.css';

const Loading = ({
  size = '48px',
  color = '#16213e',
  thickness = '6px',
  speed = '0.9s',
  variant = 'wave', // 'spinner', 'dots', 'pulse', 'wave'
  text = 'Thinking...',
  showText = true,
}) => {
  const style = {
    '--loader-size': size,
    '--loader-color': color,
    '--loader-thickness': thickness,
    '--loader-speed': speed,
  };

  const renderLoader = () => {
    switch (variant) {
      case 'dots':
        return (
          <div className="dots-loader" style={style}>
            <div className="dot"></div>
            <div className="dot"></div>
            <div className="dot"></div>
          </div>
        );
      case 'pulse':
        return (
          <div className="pulse-loader" style={style}>
            <div className="pulse-circle"></div>
            <div className="pulse-circle"></div>
            <div className="pulse-circle"></div>
          </div>
        );
      case 'wave':
        return (
          <div className="wave-loader" style={style}>
            <div className="wave-bar"></div>
            <div className="wave-bar"></div>
            <div className="wave-bar"></div>
            <div className="wave-bar"></div>
            <div className="wave-bar"></div>
          </div>
        );
      default:
        return (
          <div className="spinner-loader" style={style}>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
            <div className="spinner-ring"></div>
          </div>
        );
    }
  };

  return (
    <div className="dope-loader" role="status" aria-label="Loading">
      {renderLoader()}
      {showText && <div className="loader-text">{text}</div>}
    </div>
  );
};

export default Loading;
