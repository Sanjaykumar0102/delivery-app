import React, { useState, useEffect, useRef } from "react";
import { searchLocations, getCurrentLocation, getPopularLocations } from "../services/enhancedLocationService";
import "./LocationAutocomplete.css";

const LocationAutocomplete = ({ value, onChange, placeholder, label, required }) => {
  const [inputValue, setInputValue] = useState(value?.address || "");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPopular, setShowPopular] = useState(false);
  const wrapperRef = useRef(null);
  const debounceTimer = useRef(null);

  useEffect(() => {
    if (value?.address) {
      setInputValue(value.address);
    }
  }, [value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setShowPopular(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = async (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (newValue.trim().length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Debounce search
    debounceTimer.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchLocations(newValue);
        setSuggestions(results);
        setShowSuggestions(true);
        setShowPopular(false);
      } catch (error) {
        console.error("Error searching locations:", error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 500);
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion.shortAddress || suggestion.address);
    setShowSuggestions(false);
    setShowPopular(false);
    
    // Call onChange with location data
    onChange({
      address: suggestion.address,
      shortAddress: suggestion.shortAddress || suggestion.address,
      lat: suggestion.lat,
      lng: suggestion.lng,
      city: suggestion.city,
      state: suggestion.state,
    });
  };

  const handleGetCurrentLocation = async () => {
    setLoading(true);
    try {
      const location = await getCurrentLocation();
      setInputValue(location.address);
      setShowSuggestions(false);
      setShowPopular(false);
      onChange(location);
    } catch (error) {
      alert(error.message || "Unable to get current location. Please enable location services.");
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = () => {
    if (inputValue.trim().length === 0) {
      setShowPopular(true);
      setShowSuggestions(false);
    } else if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handlePopularLocationClick = (location) => {
    const displayName = `${location.name}, ${location.state}`;
    setInputValue(displayName);
    setShowPopular(false);
    onChange({
      address: displayName,
      shortAddress: location.name,
      lat: location.lat,
      lng: location.lng,
      city: location.name,
      state: location.state,
    });
  };

  const popularLocations = getPopularLocations();

  return (
    <div className="location-autocomplete" ref={wrapperRef}>
      {label && (
        <label className="location-label">
          {label} {required && <span className="required">*</span>}
        </label>
      )}
      
      <div className="location-input-wrapper">
        <input
          type="text"
          className="location-input"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          placeholder={placeholder || "Enter location"}
          required={required}
        />
        
        <button
          type="button"
          className="current-location-btn"
          onClick={handleGetCurrentLocation}
          disabled={loading}
          title="Use current location"
        >
          {loading ? "⏳" : "📍"}
        </button>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="location-loading">
          <span className="spinner"></span> Searching...
        </div>
      )}

      {/* Popular locations */}
      {showPopular && popularLocations.length > 0 && (
        <div className="location-suggestions">
          <div className="suggestions-header">
            <span className="suggestions-title">🌟 Popular Locations in Telangana</span>
          </div>
          {popularLocations.map((location, index) => (
            <div
              key={index}
              className="suggestion-item popular"
              onClick={() => handlePopularLocationClick(location)}
            >
              <span className="suggestion-icon">📍</span>
              <div className="suggestion-content">
                <div className="suggestion-name">{location.name}</div>
                <div className="suggestion-state">{location.area} • {location.state}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="location-suggestions">
          <div className="suggestions-header">
            <span className="suggestions-title">
              📍 Search Results
              {suggestions.filter(s => s.isTelangana).length > 0 && (
                <span className="telangana-badge"> ⭐ {suggestions.filter(s => s.isTelangana).length} in Telangana</span>
              )}
            </span>
          </div>
          {suggestions.map((suggestion, index) => (
            <div
              key={index}
              className={`suggestion-item ${suggestion.isTelangana ? 'telangana-result' : ''}`}
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <span className="suggestion-icon">{suggestion.isTelangana ? '⭐' : '📍'}</span>
              <div className="suggestion-content">
                <div className="suggestion-name">
                  {suggestion.shortAddress || suggestion.name}
                  {suggestion.isTelangana && <span className="telangana-tag">Telangana</span>}
                </div>
                <div className="suggestion-details">
                  {suggestion.suburb && <span className="detail-item">{suggestion.suburb}</span>}
                  {suggestion.city && <span className="detail-item">{suggestion.city}</span>}
                  {!suggestion.isTelangana && suggestion.state && (
                    <span className="detail-item state-name">{suggestion.state}</span>
                  )}
                  {suggestion.pincode && <span className="detail-item pincode">PIN: {suggestion.pincode}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No results */}
      {showSuggestions && !loading && suggestions.length === 0 && inputValue.trim().length >= 2 && (
        <div className="location-suggestions">
          <div className="no-results">
            <span>❌</span>
            <p>No locations found</p>
            <small>Try searching for: Area name, Landmark, or City</small>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;