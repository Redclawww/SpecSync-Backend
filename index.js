import dotenv from "dotenv";
dotenv.config();

import express from "express";
const app = express();

import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const port = process.env.PORT || 3001;

import cors from "cors";
app.use(cors());
import bodyParser from "body-parser";
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

import Webhook from "svix";

import {  getBrands, getBrand, getDevice } from "./services/catalog.js";

const corsOptions = {
  
};

app.use(bodyParser.json());
app.use(express.json());
app.use(cors({
  origin: ['https://spec-sync.vercel.app', 'http://localhost:5173'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization','Access-Control-Allow-Origin'],
}));

import  { GoogleGenerativeAI } from "@google/generative-ai";
const genAI = new GoogleGenerativeAI(`${process.env.AIKey}`);

const BrandList = new mongoose.Schema({
  id: String,
  name: String,
  devices: Number,
});

const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  photo: {
    type: String,
    required: true,
  },
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
});

const User = mongoose.model("User", userSchema);

const comparisonSchema = new mongoose.Schema({
  userId: { type: String, ref: "User" },
  email: String,
  device1: String, 
  device2: String,  
  userInput: String, 
  finalVerdict: String,
});

const ComparisonHistory = mongoose.model("ComparisonHistory", comparisonSchema);

app.post("/auth", async (req, res) => {
  try {
    const { uid, email, name } = req.body;
    let existingUser = await User.findOne({ clerkId });

    // If user doesn't exist, create a new user record
    if (!existingUser) {
      existingUser = new User({
        uid,
        email,
        name,
        
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



app.get("/brandlist", async (req, res) => {
  try {
    const brands = await getBrands();
  res.json(brands);
  } catch (error) {
    console.log(error);
  }
});

app.post("/getdevicelist", async (req, res) => {
  try {
    const Brand = req.body.brandId;
    const device = await getBrand(Brand);
    res.json(device);
  } catch (error) {
    console.log("gsmserror:",error);
    res.json(error);
  }
});

app.post("/devicedetails", async (req, res) => {
  try {
    const deviceId = req.body.deviceId;
    const device = await getDevice(deviceId);
    res.json(device);
  } catch (error) {
    res.json(error);
  }
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

app.post('/api/webhook',bodyParser.raw({type:"application/json"}),async (req, res) => {
  try {
    const payloadString = req.body.toString();
    const svixHeaders = req.headers;
    const wh = new Webhook(process.env.WEBHOOK_SECRET);
    const evt = wh.verify(payloadString,svixHeaders);
    const {id, ...attributes} = evt.data;
    const evenType = evt.type;
    if(evenType === "user.created"){
      console.log(`user ${id} is ${evenType}`);
      console.log(attributes);
    }

    res.send(200).json({
      success: true,
      message: "Webhook received"
    })

  } catch (error) {
    res.send(400).json({
      success: false,
      message: "Webhook not received"
    })
  }
});

app.post("/save", async (req, res) => {
  try {
    const { email, device1, device2, userInput, finalVerdict } = req.body;
    const comparison = new ComparisonHistory({
      email,
      device1,
      device2,
      userInput,
      finalVerdict,
    });

    await comparison.save();

    res.status(201).json({ message: "Comparison saved successfully" });
  } catch (error) {
    console.error("Error saving comparison:", error);
    res.status(500).json({ message: "Error saving comparison" });
  }
});


app.post("/data", async (req, res) => {
  try {
    const email = req.body.email;
    const data = await ComparisonHistory.find({ email });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



app.listen(port, async() => {
  console.log(`Example app listening on port ${port}`);
  await mongoose
    .connect(process.env.MONGO_URI, { useNewUrlParser: true })
    .then(() => {
      console.log("Database connected");
    });
});

