const express = require('express')
const app = express();
const mongoose = require('mongoose');
const port = 3001;
const cors = require('cors'); 
const gsmarena = require("gsmarena-api");
app.use(express.json());
app.use(cors()); 
const BrandList = new mongoose.Schema({ id: String, name: String, devices: Number});
const Brands = mongoose.model('Brands', BrandList);
 
app.get('/brandlist', async (req, res) => {
    const brands = await gsmarena.catalog.getBrands(); 
    // const brands = await Brands.find({});
    res.json(brands);
});

app.post('/getdevicelist',async(req,res)=>{
  try {
    const getBrand = req.body.brandId;
    const device = await gsmarena.catalog.getBrand(getBrand);
    res.json(device);
  } catch (error) {
    console.log("gsmserror");
    res.json(error)
  }
})

app.post('/devicedetails',async(req,res)=>{
  try {
  const deviceId = req.body.deviceId;
  const device = await gsmarena.catalog.getDevice(deviceId);
  res.json(device);
  } catch (error) {
    res.json(error);
  }
})

app.listen(port,() => {
  console.log(`Example app listening on port ${port}`);
  // mongoose.connect(`mongodb+srv://red:red@specsync.u5sdpun.mongodb.net/data?retryWrites=true&w=majority`,{ useNewUrlParser: true}).then(()=>{
  // console.log('Database connected');
  // });
});