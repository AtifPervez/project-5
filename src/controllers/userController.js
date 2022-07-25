const userModel = require("../models/userModel")
const { uploadFile } = require("../utils/aws")
const bcrypt = require("bcrypt")
const validator = require("../validator/validator")

// Regex
const objectid = /^[0-9a-fA-F]{24}$/
const nameRegex = /^[ a-z ]+$/i
const emailRegex = /^\w+@[a-zA-Z_]+?\.[a-zA-Z]{2,3}$/
const phoneRegex = /^[6-9]\d{9}$/

const register = async function (req, res) {
    try {
        let data = req.body
        let { fname, lname, email, phone, password, address } = data
        let files = req.files

        if (!(files && files.length)) {
            return res.status(400).send({ status: false, message: "Please Provide The Profile Image" });
        }

        const uploadedProfileImage = await uploadFile(files[0])
        password = await bcrypt.hash(password, 10);
        data.password = password
        data.profileImage = uploadedProfileImage
        data.address = JSON.parse(address)

        let createdUser = await userModel.create(data)

        return res.status(201).send({ status: true, message: "User created successsfully", data: createdUser })
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })

    }
}

const updateUser = async function (req, res) {
    try {
        let userId = req.params.userId
        let data = req.body

        if(!userId) return res.status(400).send({status : false, message : "Please provide userId"})
        if(!validator.isValid(userId))  return res.status(400).send({status : false, message : "Incorrect userId"})
        if(!userId.match(objectid)) return res.status(400).send({status : false, message : "Incorrect userId"})

        let user = await userModel.findById(userId)
        if(!user)   return res.status(404).send({status : false, message : "User not found"})
        //if(req.token.userId != userId)  return res.status(403).send({status : false, message : "Not Authorised"})
        if(!validator.isValidRequestBody(data))   return res.status(400).send({status : false, message : "Please provide data to update"})

        let {fname, lname, email, phone, password, address} = data
        if(fname) {
            if(!validator.isValid(fname))   return res.status(400).send({status : false, message : "fname is in incorrect format"})
            if(!fname.match(nameRegex)) return res.status(400).send({status : false, message : "fname is in incorrect format"})
        }
        if(lname) {
            if(!validator.isValid(lname))   return res.status(400).send({status : false, message : "lname is in incorrect format"})
            if(!lname.match(nameRegex)) return res.status(400).send({status : false, message : "lname is in incorrect format"})
        }
        if(email) {
            if(!validator.isValid(email))   return res.status(400).send({status : false, message : "email is in incorrect format"})
            if(!email.match(emailRegex)) return res.status(400).send({status : false, message : "email is in incorrect format"})
            let user = await userModel.findOne({email})
            if(user)    return res.status(400).send({status : false, message : "email already used"})
        }
        if(phone) {
            if(!validator.isValid(phone))   return res.status(400).send({status : false, message : "phone is in incorrect format"})
            if(!phone.match(phoneRegex))    return res.status(400).send({status : false, message : "phone is in incorrect format"})
            let user = await userModel.findOne({phone})
            if(user)    return res.status(400).send({status : false, message : "phone already used"})
        }
        if(password) {
            if(!validator.isValid(password))   return res.status(400).send({status : false, message : "password is in incorrect format"})
            if(!validator.isValidPassword(password))   return res.status(400).send({status : false, message : "password should be 8-15 characters in length."})
            data.password = await bcrypt.hash(password, 10);
        }
        let query = {}
        if(address) {
            if(typeof address != "object")  return res.status(400).send({status : false, message : "address is in incorrect format"})
            if(address.shipping){
                if(address.shipping.street) {
                    if(!validator.isValid(address.shipping.street))  return res.status(400).send({status : false, message : "shipping street is in incorrect format"})
                    query["address.shipping.street"] = address.shipping.street
                }
                if(address.shipping.city) {
                    if(!validator.isValid(address.shipping.city))  return res.status(400).send({status : false, message : "shipping city is in incorrect format"})
                    query["address.shipping.city"] = address.shipping.city
                }
                if(address.shipping.pincode) {
                    if(typeof address.shipping.pincode != "number")  return res.status(400).send({status : false, message : "shipping pincode is in incorrect format"})
                    query["address.shipping.pincode"] = address.shipping.pincode
                }
            }
            if(address.billing){
                if(address.billing.street) {
                    if(!validator.isValid(address.billing.street))  return res.status(400).send({status : false, message : "billing street is in incorrect format"})
                    query["address.billing.street"] = address.billing.street
                }
                if(address.billing.city) {
                    if(!validator.isValid(address.billing.city))  return res.status(400).send({status : false, message : "billing city is in incorrect format"})
                    query["address.billing.city"] = address.billing.city
                }
                if(address.billing.pincode) {
                    if(typeof address.billing.pincode != "number")  return res.status(400).send({status : false, message : "billing pincode is in incorrect format"})
                    query["address.billing.pincode"] = address.billing.pincode
                }
            }
            delete data.address
        }

        let updatedUser = await userModel.findOneAndUpdate({_id : userId}, {...data, ...query} , {new : true})
        return res.status(200).send({ status: true, message: "User profile updated", data: updatedUser })
    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}

module.exports = { register, updateUser }