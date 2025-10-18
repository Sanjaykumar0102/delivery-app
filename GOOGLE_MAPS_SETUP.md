# 🗺️ Google Maps API Setup Guide

This guide will help you set up Google Maps API for the DelivraX delivery application.

## 📋 Prerequisites

- Google Cloud Platform account
- Credit card (for verification, free tier available)
- Project with billing enabled

## 🚀 Step-by-Step Setup

### 1. Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top
3. Click "New Project"
4. Enter project name: `DelivraX-Delivery-App`
5. Click "Create"

### 2. Enable Required APIs

Enable the following APIs for your project:

1. **Maps JavaScript API** - For map display
2. **Places API** - For location autocomplete
3. **Geocoding API** - For address to coordinates conversion
4. **Directions API** - For route calculation
5. **Distance Matrix API** - For distance calculation

**How to enable:**
1. Go to "APIs & Services" > "Library"
2. Search for each API
3. Click on it and press "Enable"

### 3. Create API Key

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the API key (you'll need this later)
4. Click "Restrict Key" (recommended for security)

### 4. Restrict API Key (Recommended)

#### Application Restrictions:
- **For Development:** Select "None" or "HTTP referrers"
  - Add: `http://localhost:5173/*`
  - Add: `http://localhost:*`

- **For Production:** Select "HTTP referrers"
  - Add your production domain: `https://yourdomain.com/*`

#### API Restrictions:
Select "Restrict key" and choose:
- ✅ Maps JavaScript API
- ✅ Places API
- ✅ Geocoding API
- ✅ Directions API
- ✅ Distance Matrix API

Click "Save"

### 5. Add API Key to Project

1. Open `frontend/.env` file
2. Replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual API key:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_MAPS_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

3. Save the file
4. Restart the frontend development server

## 💰 Pricing Information

### Free Tier (Monthly)
- **Maps JavaScript API:** $200 free credit
- **Places API:** $200 free credit
- **Geocoding API:** $200 free credit
- **Directions API:** $200 free credit

### Usage Estimates for Small App
- **Maps loads:** ~28,000 free per month
- **Autocomplete requests:** ~1,000 free per month
- **Geocoding requests:** ~40,000 free per month
- **Directions requests:** ~40,000 free per month

**Note:** For a small to medium delivery app, you'll likely stay within the free tier.

## 🔒 Security Best Practices

### 1. Never Commit API Keys
- Add `.env` to `.gitignore`
- Use environment variables
- Never hardcode API keys in source code

### 2. Restrict API Key
- Always restrict by HTTP referrer for web apps
- Restrict to specific APIs
- Monitor usage in Google Cloud Console

### 3. Set Usage Quotas
1. Go to "APIs & Services" > "Quotas"
2. Set daily quotas to prevent unexpected charges
3. Recommended limits:
   - Maps JavaScript API: 10,000 requests/day
   - Places API: 1,000 requests/day
   - Directions API: 2,500 requests/day

### 4. Enable Billing Alerts
1. Go to "Billing" > "Budgets & alerts"
2. Create a budget alert
3. Set threshold: $10 (or your preferred amount)
4. Add email notification

## 🧪 Testing the Setup

### 1. Test API Key
Run this in browser console on your app:
```javascript
fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=Bangalore&key=YOUR_API_KEY`)
  .then(res => res.json())
  .then(data => console.log(data));
```

### 2. Test Autocomplete
1. Go to Customer Dashboard
2. Click "Book Delivery"
3. Start typing in "Pickup Location" field
4. You should see location suggestions

### 3. Test Map Display
1. Enter pickup and dropoff locations
2. Map should display with markers
3. Route should be drawn between locations

## 🐛 Troubleshooting

### Issue: "This page can't load Google Maps correctly"
**Solution:** 
- Check if API key is correct in `.env`
- Verify billing is enabled in Google Cloud
- Check if Maps JavaScript API is enabled
- Restart frontend server after changing `.env`

### Issue: "REQUEST_DENIED" error
**Solution:**
- Check API restrictions in Google Cloud Console
- Verify HTTP referrer restrictions allow `localhost:5173`
- Ensure all required APIs are enabled

### Issue: Autocomplete not working
**Solution:**
- Check if Places API is enabled
- Verify API key has Places API permission
- Check browser console for errors
- Ensure internet connection is active

### Issue: "OVER_QUERY_LIMIT" error
**Solution:**
- Check usage in Google Cloud Console
- Increase quotas if needed
- Implement request caching
- Add rate limiting

## 📊 Monitoring Usage

### View Usage Statistics
1. Go to Google Cloud Console
2. Navigate to "APIs & Services" > "Dashboard"
3. View requests per API
4. Monitor costs in "Billing" section

### Set Up Alerts
1. Go to "Monitoring" > "Alerting"
2. Create alert policy
3. Set conditions (e.g., requests > 1000/day)
4. Add notification channels

## 🌍 India-Specific Configuration

The app is pre-configured for India (especially South Indian states):

### Location Bias
- **Primary:** Bangalore (12.9716°N, 77.5946°E)
- **Region:** South India (Karnataka, Tamil Nadu, Kerala, Andhra Pradesh, Telangana)
- **Country:** India (IN)

### Supported Cities
- Bangalore
- Chennai
- Hyderabad
- Kochi
- Coimbatore
- Mysore
- Mangalore
- Visakhapatnam
- Vijayawada
- Trivandrum
- And all other Indian cities

## 🔄 Alternative: OpenStreetMap (Free)

If you don't want to use Google Maps, you can use OpenStreetMap with Leaflet (already installed):

### Advantages:
- ✅ Completely free
- ✅ No API key required
- ✅ No usage limits
- ✅ Open source

### Disadvantages:
- ❌ Less accurate in India
- ❌ Fewer features
- ❌ No autocomplete (need third-party service)

### To Use OpenStreetMap:
1. The app already has `react-leaflet` installed
2. Use Nominatim API for geocoding (free)
3. Use OSRM for routing (free)

## 📞 Support

### Google Maps Support
- [Documentation](https://developers.google.com/maps/documentation)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/google-maps)
- [Google Maps Platform Support](https://developers.google.com/maps/support)

### DelivraX Support
- Check `README.md` for general setup
- Check `TROUBLESHOOTING.md` for common issues
- Open an issue on GitHub

## ✅ Checklist

Before going live, ensure:

- [ ] Google Cloud project created
- [ ] Billing enabled
- [ ] All required APIs enabled
- [ ] API key created and restricted
- [ ] API key added to `.env` file
- [ ] HTTP referrer restrictions configured
- [ ] Usage quotas set
- [ ] Billing alerts configured
- [ ] API key tested and working
- [ ] `.env` added to `.gitignore`
- [ ] Production domain added to restrictions

## 🎯 Quick Start (TL;DR)

1. Create Google Cloud project
2. Enable: Maps JavaScript API, Places API, Geocoding API, Directions API
3. Create API key
4. Add to `frontend/.env`: `VITE_GOOGLE_MAPS_API_KEY=your_key_here`
5. Restart frontend server
6. Test autocomplete in Customer Dashboard

---

**Note:** Keep your API key secure and never commit it to version control!