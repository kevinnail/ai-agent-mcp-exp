import React from 'react';
import './Loading.css';

const Loading = ({
  size = '48px',
  color = '#8b5cf6',
  thickness = '6px',
  speed = '0.9s',
}) => {
  const style = {
    '--loader-size': size,
    '--loader-color': color,
    '--loader-thickness': thickness,
    '--loader-speed': speed,
  };

  return (
    <div
      style={style}
      className="loader"
      role="status"
      aria-label="Loading"
    ></div>
  );
};

export default Loading;
