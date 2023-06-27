const express = require('express');
const app = express();
const route = require('../src/routes/route')
const aws = require('../src/aws/aws')
const multer= require("multer");

const { AppConfig } = require('aws-sdk');

const cors =require("cors")

app.use(express.json())
app.use(express.urlencoded({extended:true}))
app.use(cors())
app.use(multer().any())

const mongoose = require('mongoose')

require('dotenv').config();

const {PORT , MONGODB_URL} = process.env;

mongoose.set('strictQuery' , true);

mongoose.connect(
    MONGODB_URL ,
    { useNewUrlParser : true }
)
.then(()=>{
    console.log("Server Connected with MongoDb")
})
.catch((error)=>{
    console.log("Error in connection", error.message)
})

app.use('/',route);

app.listen(PORT , ()=>{
    console.log(`Server running at ${PORT}`)
})
