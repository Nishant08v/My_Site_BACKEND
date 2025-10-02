// geocode.js
const axios = require("axios");

/**
 * Fetch coordinates for a given address using OpenStreetMap Nominatim API
 * @param {string} address
 * @returns {Promise<{ lat: number, lng: number }>}
 */
async function getCoordsForAddress(address) {
  if (!address) throw new Error("Address is required");

  try {
    const response = await axios.get("https://nominatim.openstreetmap.org/search", {
      params: {
        q: address,
        format: "json",
        limit: 1
      },
      headers: {
        "User-Agent": "MyApp (nishant11a5014@gmail.com)" // required by Nominatim
      }
    });

    if (response.data.length === 0) {
      throw new Error("No results found");
    }

    const { lat, lon } = response.data[0];
    return { lat: parseFloat(lat), lng: parseFloat(lon) };
  } catch (error) {
    throw new Error("Failed to fetch coordinates: " + error.message);
  }
}

module.exports = getCoordsForAddress;
