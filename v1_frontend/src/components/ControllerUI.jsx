import React, { useState, useEffect } from 'react';
import './ControllerUI.css';

function ControllerUI({ onInput, playerName }) {
  const [activeButtons, setActiveButtons] = useState(new Set());
  const [joystick, setJoystick] = useState({ x: 0, y: 0 });

  const handleButtonDown = (button) => {
    setActiveButtons(prev => new Set(prev).add(button));
    onInput({ type: 'button', button, action: 'down' });
  };

  const handleButtonUp = (button) => {
    setActiveButtons(prev => {
      const next = new Set(prev);
      next.delete(button);
      return next;
    });
    onInput({ type: 'button', button, action: 'up' });
  };

  const handleJoystickMove = (e) => {
    const touch = e.touches[0];
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect. width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const deltaX = touch.clientX - centerX;
    const deltaY = touch.clientY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = rect.width / 2;
    
    if (distance > maxDistance) {
      const angle = Math.atan2(deltaY, deltaX);
      const x = Math.cos(angle) * maxDistance;
      const y = Math.sin(angle) * maxDistance;
      setJoystick({ x:  x / maxDistance, y: y / maxDistance });
    } else {
      setJoystick({ x: deltaX / maxDistance, y: deltaY / maxDistance });
    }
    
    onInput({ 
      type: 'joystick', 
      x: joystick.x, 
      y: joystick.y 
    });
  };

  const handleJoystickEnd = () => {
    setJoystick({ x: 0, y: 0 });
    onInput({ type: 'joystick', x: 0, y: 0 });
  };

  return (
    <div className="controller-ui">
      <div className="controller-layout">
        {/* Left side - Joystick */}
        <div className="left-controls">
          <div 
            className="joystick-container"
            onTouchMove={handleJoystickMove}
            onTouchEnd={handleJoystickEnd}
          >
            <div className="joystick-base">
              <div 
                className="joystick-stick"
                style={{
                  transform: `translate(${joystick.x * 40}px, ${joystick. y * 40}px)`
                }}
              />
            </div>
            <div className="joystick-label">Joystick</div>
          </div>
        </div>

        {/* Right side - Action buttons */}
        <div className="right-controls">
          <div className="button-group">
            <button
              className={`game-button btn-a ${activeButtons.has('A') ? 'active' : ''}`}
              onTouchStart={() => handleButtonDown('A')}
              onTouchEnd={() => handleButtonUp('A')}
              onMouseDown={() => handleButtonDown('A')}
              onMouseUp={() => handleButtonUp('A')}
            >
              A
            </button>
            <button
              className={`game-button btn-b ${activeButtons.has('B') ? 'active' : ''}`}
              onTouchStart={() => handleButtonDown('B')}
              onTouchEnd={() => handleButtonUp('B')}
              onMouseDown={() => handleButtonDown('B')}
              onMouseUp={() => handleButtonUp('B')}
            >
              B
            </button>
          </div>
        </div>
      </div>

      {/* D-Pad */}
      <div className="dpad-container">
        <div className="dpad">
          <button
            className={`dpad-btn dpad-up ${activeButtons.has('UP') ? 'active' : ''}`}
            onTouchStart={() => handleButtonDown('UP')}
            onTouchEnd={() => handleButtonUp('UP')}
            onMouseDown={() => handleButtonDown('UP')}
            onMouseUp={() => handleButtonUp('UP')}
          >
            ▲
          </button>
          <button
            className={`dpad-btn dpad-left ${activeButtons.has('LEFT') ? 'active' : ''}`}
            onTouchStart={() => handleButtonDown('LEFT')}
            onTouchEnd={() => handleButtonUp('LEFT')}
            onMouseDown={() => handleButtonDown('LEFT')}
            onMouseUp={() => handleButtonUp('LEFT')}
          >
            ◄
          </button>
          <button
            className={`dpad-btn dpad-right ${activeButtons.has('RIGHT') ? 'active' : ''}`}
            onTouchStart={() => handleButtonDown('RIGHT')}
            onTouchEnd={() => handleButtonUp('RIGHT')}
            onMouseDown={() => handleButtonDown('RIGHT')}
            onMouseUp={() => handleButtonUp('RIGHT')}
          >
            ►
          </button>
          <button
            className={`dpad-btn dpad-down ${activeButtons.has('DOWN') ? 'active' : ''}`}
            onTouchStart={() => handleButtonDown('DOWN')}
            onTouchEnd={() => handleButtonUp('DOWN')}
            onMouseDown={() => handleButtonDown('DOWN')}
            onMouseUp={() => handleButtonUp('DOWN')}
          >
            ▼
          </button>
        </div>
      </div>
    </div>
  );
}

export default ControllerUI;