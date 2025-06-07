// server.js
import express from "express";

const app = express();
const PORT = process.env.PORT || 5000;

// Dynamic import of node-fetch (ESM)
async function fetchData(url) {
  const fetch = (await import("node-fetch")).default;
  return fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0', // Required by Swiggy to prevent 403
    },
  });
}

// Enable CORS for all routes
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});




app.get("/", (req, res) => {
  res.send("Swiggy backend proxy is running!");
});


// Route to get restaurant list
app.get("/api/swiggy", async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: "Please provide lat and lng query params" });
  }

  try {
    const url = `https://www.swiggy.com/dapi/restaurants/list/v5?lat=${lat}&lng=${lng}&is-seo-homepage-enabled=true&page_type=DESKTOP_WEB_LISTING&_=${Date.now()}`;
    const response = await fetchData(url);

    if (!response.ok) {
      throw new Error(`Swiggy API returned status ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error in /api/swiggy:", error);
    res.status(500).json({ error: "Failed to fetch data from Swiggy" });
  }
});

// ✅ New route to get menu by restaurant ID
app.get("/api/menu", async (req, res) => {
  const { lat, lng, restaurantId } = req.query;
  if (!lat || !lng || !restaurantId) {
    return res.status(400).json({ error: "Missing lat, lng, or restaurantId" });
  }

  try {
    const url = `https://www.swiggy.com/dapi/menu/pl?page-type=REGULAR_MENU&complete-menu=true&lat=${lat}&lng=${lng}&restaurantId=${restaurantId}&catalog_qa=undefined&submitAction=ENTER`;
    const response = await fetchData(url);

    if (!response.ok) {
      throw new Error(`Swiggy menu API returned status ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("Error in /api/menu:", error);
    res.status(500).json({ error: "Failed to fetch menu from Swiggy" });
  }
});

app.listen(PORT, () => {
  console.log(`Swiggy proxy backend running on port ${PORT}`);
});
