// const express = require('express');
// const fetch = require('node-fetch');
import express from 'express';
// const dotenv = require('dotenv');
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080

// Middleware to get client's IP address
app.use(async (req, res, next) => {
  try {
    const ipResponse = await fetch('https://httpbin.org/ip');
    const ipData = await ipResponse.json();
    req.clientIp = ipData.origin;
  } catch (error) {
    console.error('Failed to fetch public IP:', error);
    req.clientIp = null;
  }
  next();
});

// Function to get geolocation data
async function getGeolocation(ip) {
  const response = await fetch(`http://ip-api.com/json/${ip}`);
  if (!response.ok) {
    throw new Error('Failed to fetch geolocation data');
  }
  const data = await response.json();
  return data;
}

// Function to get weather data
async function getWeather(lat, lon) {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Failed to fetch weather data: ${errorData.message}`);
  }
  const data = await response.json();
  return data;
}

// API endpoint to get weather data based on client's IP address
app.get('/api/hello', async (req, res) => {
  const visitorName = req.query.visitor_name;
  const ip = req.clientIp;

  if (!ip) {
    res.status(500).json({ error: 'Failed to determine public IP address' });
    return;
  }

  try {
    const geoData = await getGeolocation(ip);
    if (geoData.status !== 'success') {
      throw new Error(geoData.message || 'Failed to fetch geolocation data');
    }
    const weatherData = await getWeather(geoData.lat, geoData.lon);
    const temperature = weatherData.main.temp;
    const location = geoData.city;

    res.json({
      client_ip: ip,
      location: location,
      greeting: `Hello, ${visitorName}!, the temperature is ${temperature} degrees Celcius in ${location}`
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on 0.0.0.0:${PORT}`);
});
