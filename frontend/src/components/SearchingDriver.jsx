import React, { useState, useEffect } from 'react';
import './SearchingDriver.css';

const SearchingDriver = ({ orderId, onCancel, onTimeout, onRetry }) => {
  const [timeElapsed, setTimeElapsed] = useState(0);
  const [timedOut, setTimedOut] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const MAX_WAIT_TIME = 120; // 2 minutes in seconds

  useEffect(() => {
    // Reset timer when component mounts or when retrying
    if (isRetrying) {
      setTimeElapsed(0);
      setTimedOut(false);
      setIsRetrying(false);
    }

    const timer = setInterval(() => {
      setTimeElapsed((prev) => {
        const newTime = prev + 1;
        if (newTime >= MAX_WAIT_TIME && !timedOut) {
          setTimedOut(true);
          clearInterval(timer);
          if (onTimeout) {
            onTimeout();
          }
        }
        return newTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onTimeout, isRetrying, timedOut]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return (timeElapsed / MAX_WAIT_TIME) * 100;
  };

  if (timedOut) {
    return (
      <div className="searching-driver-overlay">
        <div className="searching-driver-container timeout-container">
          <div className="timeout-animation">
            <div className="sad-icon">😔</div>
            <div className="timeout-waves">
              <div className="timeout-wave"></div>
              <div className="timeout-wave"></div>
            </div>
          </div>

          <h2 className="timeout-title">No Drivers Available</h2>
          <p className="timeout-subtitle">We couldn't find a driver at the moment</p>

          <div className="timeout-info">
            <div className="timeout-info-item">
              <span className="timeout-info-icon">⏰</span>
              <span className="timeout-info-text">All drivers are currently busy</span>
            </div>
            <div className="timeout-info-item">
              <span className="timeout-info-icon">🔄</span>
              <span className="timeout-info-text">Please try again in a few minutes</span>
            </div>
            <div className="timeout-info-item">
              <span className="timeout-info-icon">📞</span>
              <span className="timeout-info-text">Or contact support for assistance</span>
            </div>
          </div>

          <div className="timeout-actions">
            <button 
              className="retry-booking-btn" 
              onClick={async () => {
                console.log("🔄 Retry button clicked");
                try {
                  // Reset component state first
                  setIsRetrying(true);
                  setTimedOut(false);
                  setTimeElapsed(0);
                  
                  // Call the retry function passed from parent
                  if (onRetry) {
                    await onRetry();
                  }
                } catch (error) {
                  console.error("❌ Error in retry:", error);
                  // Reset to timeout state if retry fails
                  setTimedOut(true);
                  setIsRetrying(false);
                }
              }}
            >
              <span className="btn-icon">🔄</span>
              <span className="btn-text">Retry Search</span>
            </button>
            <button className="close-booking-btn" onClick={() => {
              console.log("✕ Close button clicked");
              if (onCancel) {
                onCancel();
              }
            }}>
              <span className="btn-icon">✕</span>
              <span className="btn-text">Close</span>
            </button>
          </div>

          <p className="timeout-note">
            💡 Tip: Peak hours may have longer wait times
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="searching-driver-overlay">
      <div className="searching-driver-container">
        <div className="searching-animation">
          <div className="scooter-wrapper">
            <div className="scooter-icon">🛵</div>
            <div className="scooter-shadow"></div>
          </div>
          <div className="search-waves">
            <div className="wave wave-1"></div>
            <div className="wave wave-2"></div>
            <div className="wave wave-3"></div>
            <div className="wave wave-4"></div>
          </div>
          <div className="search-particles">
            <div className="particle particle-1">✨</div>
            <div className="particle particle-2">⭐</div>
            <div className="particle particle-3">💫</div>
            <div className="particle particle-4">✨</div>
          </div>
        </div>

        <h2 className="searching-title">
          <span className="title-text">Searching for a driver</span>
          <span className="loading-dots">
            <span className="dot">.</span>
            <span className="dot">.</span>
            <span className="dot">.</span>
          </span>
        </h2>
        <p className="searching-subtitle">Please wait while we assign a driver</p>

        <div className="timer-display">
          <div className="timer-ring">
            <svg className="timer-svg" viewBox="0 0 100 100">
              <circle
                className="timer-circle-bg"
                cx="50"
                cy="50"
                r="45"
              />
              <circle
                className="timer-circle-progress"
                cx="50"
                cy="50"
                r="45"
                style={{
                  strokeDashoffset: 283 - (283 * getProgressPercentage()) / 100
                }}
              />
            </svg>
            <div className="timer-content">
              <div className="timer-icon">⏱️</div>
              <div className="timer-value">{formatTime(timeElapsed)}</div>
            </div>
          </div>
        </div>

        <div className="searching-info">
          <div className="info-item">
            <div className="info-icon-wrapper">
              <span className="info-icon">🔍</span>
            </div>
            <div className="info-text-wrapper">
              <span className="info-text">Finding nearby drivers</span>
              <span className="info-subtext">Scanning your area</span>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon-wrapper">
              <span className="info-icon">📍</span>
            </div>
            <div className="info-text-wrapper">
              <span className="info-text">Matching your location</span>
              <span className="info-subtext">Optimizing route</span>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon-wrapper">
              <span className="info-icon">✅</span>
            </div>
            <div className="info-text-wrapper">
              <span className="info-text">Verifying availability</span>
              <span className="info-subtext">Confirming driver</span>
            </div>
          </div>
        </div>

        <button className="cancel-booking-btn" onClick={() => {
          console.log("✕ Cancel booking button clicked");
          if (onCancel) {
            onCancel();
          }
        }}>
          <span className="btn-icon">✕</span>
          <span className="btn-text">Cancel booking</span>
        </button>

        <div className="searching-footer">
          <p className="searching-note">
            💡 Most drivers are assigned within 1-2 minutes
          </p>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${getProgressPercentage()}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchingDriver;