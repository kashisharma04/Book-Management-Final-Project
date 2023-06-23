const userModel = require("../models/userModel")
const jwt = require("jsonwebtoken");

require('dotenv').config();
const { JWT_SECRET, JWT_EXPIRY } = process.env

const {isValid,isValidString,isValidRequestBody,isValidEmail,isValidPassword,isValidMobile,isValidPincode,isValidPlace }=require("../utils/validation")



const createUser = async function ( req , res ) {
    try {
        let data = req.body;
        let { title, name, phone, email, password, address } = data;

        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Request can't be empty" });
        }

        if (!title || !name || !phone || !email || !password) {
            return res.status(400).send({ status: false, message: "Please Provide All Field" });
        }

        if (!isValid(title) || !isValid(name) || !isValid(phone) || !isValid(email) || !isValid(password)) {
            return res.status(400).send({ status: false, message: "Please Provide All valid Field" });
        }
        
        if (!isValidString(title) || !isValidString(name)) {
            return res.status(400).send({ status: false, message: "Title and Name must be Valid" });
        }

        if (!["Mr", "Mrs", "Miss"].includes(title)) {
            return res.status(400).send({ status: false, message: "please use a valid title as Mr,Mrs,Miss" });
        }

        if (!isValidMobile(phone)) {
            return res.status(400).send({ status: false, message: "Enter a valid format number" });
        }

        if (!isValidEmail(email)) {
            return res.status(400).send({ status: false, message: "Enter a valid email" });
        }

        const unique = await userModel.findOne({
            $or: [{ phone: phone }, { email: email }]
          });

        if (unique) {
            return res.status(400).send({ status: false, message: "Email Or Phone Number already exits" });
        }

        if (!isValidPassword(password)) {
            return res.status(400).send({ status: false, message: "Password Must be 8-15 length,consist of mixed character and special character" });
        }

        if (address) {

            if (typeof address != "object") {
                return res.status(400).send({ status: false, message: "value of address must be in json format" });
            }

            let { street, city, pincode } = address;

            if (!isValid(street) || !isValid(city) || !isValid(pincode)) {
                return res.status(400).send({ status: false, message: "Please Provide All valid street, city, pincode" });
            }
            
            if (!isValidPlace(street) || !isValidPlace(city) || !isValidPincode(pincode)) {
                return res.status(400).send({ status: false, message: "Please Provide All valid street, city, pincode" });
            }
        }

        let userDetails = await userModel.create(data);
        let response = {
            _id:userDetails._id,
            title:userDetails.title,
            name:userDetails.name,
            phone:userDetails.phone,
            email:userDetails.email,
            password:userDetails.password,
            address: userDetails.address, 
            createdAt:userDetails.createdAt,
            updatedAt:userDetails.updatedAt 
        }

        res.status(201).send({ status: true, message :"Successfull Created User", data: response });
    } catch (error) {
        return res.status(500).send({ status: false, message: error.message });
    }
}



// ====================================== LOGIN User ======================================================//
const loginUser = async function ( req , res ) {
    try {
        const data = req.body;
        let { email, password } = data;
        if (!isValidRequestBody(data)) {
            return res.status(400).send({ status: false, message: "Body can not be empty" });
        }

            if (!isValid(email) || !isValid(password)) {
                return res.status(400).send({ status: false, message: "email must be valid" });
            }

            const userData = await userModel.findOne({ email: email, password: password });
            if (!userData) {
                return res.status(404).send({ status: false, message: "No such user exist. Please Enter a valid Email and Password." });
            }

            const token = jwt.sign({userId: userData._id.toString()}, JWT_SECRET,{
                expiresIn : JWT_EXPIRY
            })

            res.setHeader("x-api-key", token);
            res.status(200).send({ status: true,message :"User LoggedIn", data: { "token": token} });
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message });
    }
}


module.exports = { createUser, loginUser };