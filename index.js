require("dotenv").config();
const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const port = process.env.PORT || 3001;
const cors = require("cors");
const gsmarena = require("gsmarena-api");
const bodyParser = require("body-parser");

app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

// Gemini Configs
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(`${process.env.AIKey}`);

const BrandList = new mongoose.Schema({
  id: String,
  name: String,
  devices: Number,
});

const userSchema = new mongoose.Schema({
  uid: String,
  email: String,
  name: String,
  // Add more fields as needed
});

const comparisonSchema = new mongoose.Schema({
  userId: { type: String, ref: "User" },
  email: String,
  device1: String, // Name of device 1
  device2: String, // Name of device 2
  userInput: String, // Specific specifications used for comparison
  finalVerdict: String,
  // Add other fields as needed
});

const Brands = mongoose.model("Brands", BrandList);
const User = mongoose.model("User", userSchema);
const ComparisonHistory = mongoose.model("ComparisonHistory", comparisonSchema);

app.post("/auth", async (req, res) => {
  try {
    // Get user data from the request body
    const { uid, email, name } = req.body;

    // Check if user already exists in the database
    let existingUser = await User.findOne({ uid });

    // If user doesn't exist, create a new user record
    if (!existingUser) {
      existingUser = new User({
        uid,
        email,
        name,
        // Add more fields as needed
      });
      await existingUser.save();
    }

    res
      .status(200)
      .json({ message: "User data received and processed successfully." });
  } catch (error) {
    console.error("Error saving user data:", error);
    res.status(500).json({ message: "Error saving user data." });
  }
});

app.get("/data/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const data = await ComparisonHistory.find({ email });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post("/save", async (req, res) => {
  try {
    const { email, device1, device2, userInput, finalVerdict } = req.body;

    // Create a new comparison history object
    const comparison = new ComparisonHistory({
      email,
      device1,
      device2,
      userInput,
      finalVerdict,
    });

    // Save the comparison history to the database
    await comparison.save();

    res.status(201).json({ message: "Comparison saved successfully" });
  } catch (error) {
    console.error("Error saving comparison:", error);
    res.status(500).json({ message: "Error saving comparison" });
  }
});

app.get("/brandlist", async (req, res) => {
  const brands = await gsmarena.catalog.getBrands();
  res.json(brands);
});

app.post("/getdevicelist", async (req, res) => {
  try {
    const getBrand = req.body.brandId;
    const device = await gsmarena.catalog.getBrand(getBrand);
    res.json(device);
  } catch (error) {
    console.log("gsmserror:",error);
    res.json(error);
  }
});

app.post("/devicedetails", async (req, res) => {
  try {
    const deviceId = req.body.deviceId;
    const device = await gsmarena.catalog.getDevice(deviceId);
    res.json(device);
  } catch (error) {
    res.json(error);
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
  mongoose
    .connect(`mongodb://0.0.0.0:27017/Spec-Sync`, { useNewUrlParser: true })
    .then(() => {
      console.log("Database connected");
    });
});

app.post("/compare", async (req, res) => {
  const { userInput, device1, device2 } = req.body;
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `Compare the two smart phones devices device1:${device1.name} device2:${device2.name} and user preference: ${userInput} and provide the whole response in plain text and no markdown language and dont show the specification just give the ultimate answer`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  res.json(text);
});
