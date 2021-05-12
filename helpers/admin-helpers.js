var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const { response } = require("express");
const { log } = require("debug");
var objectId = require("mongodb").ObjectID;
var Razorpay=require('razorpay');
const { resolve } = require("path");

var instance = new Razorpay({
  key_id: 'rzp_test_KOTHbmObx2sshs',
  key_secret: 'DVnAQpkaphxxmq0zLhlWA51s',
});
module.exports = {
  
  doLogin: (userData) => {
    let loginStatus = false;
    let response = {};
    console.log(userData);
    return new Promise(async (resolve, reject) => {
      let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ email: userData.email });
      if (admin) {
        db.get()
          .collection(collection.ADMIN_COLLECTION)
          .findOne({ password: userData.password })
          .then((status) => {
            if (status) {
              console.log("suucusfully logined");
              response.admin = admin;
              response.status = true;
              resolve(response);
            } else {
              console.log("logine failed - password incorrect");
              resolve({ status: false });
            }
          });
      } else {
        console.log("failed-user not found");
        resolve({ status: false });
      }
    });
  },
  getAlluser:()=>{
    return new Promise(async(resolve,reject)=>{
      let Users=await db.get().collection(collection.USER_COLLECTION).find().toArray()
      resolve(Users)

    })

  },
  getUserOrder:()=>{
   
    return new Promise(async(resolve,reject)=>{
      let orders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
     
      resolve(orders)


    })
 

  }
 
 

}


























// deleteCart:(proId)=>{
//     return new Promise((resolve,reject)=>{
//         db.get().collection(collection.PRODUCT_COLLECTION).removeOne({_id:objectId(proId)}).then((response)=>{
//             resolve(response)
//         })
//     })

// }
// cartRemove:(proId)=>{
//     return new Promise((resolve,reject)=>{
//                 db.get().collection(collection.CART_COLLECTION).removeOne({_id:objectId(proId)}).then((response)=>{
//                     resolve(response)
//                 })
//             })

//         }
