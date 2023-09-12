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
 

  },
  getCartProducts: (userId) => {
    console.log(userId, "userId");
    return new Promise(async (resolve, reject) => {
      let cartItems = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .aggregate([
          {
            $match: { user: objectId(userId) },
          },
          {
            $unwind: "$products",
          },
          {
            $project: {
              item: "$products.item",
              quantity: "$products.quantity",
            },
          },
          {
            $lookup: {
              from: collection.PRODUCT_COLLECTION,
              localField: "item",
              foreignField: "_id",
              as: "product",
            },
          },
          {
            $project: {
              item: 1,
              quantity: 1,
              product: { $arrayElemAt: ["$product", 0] },
            },
          },
          // {
          //     $lookup:{
          //         from:collection.PRODUCT_COLLECTION,
          //         let:{proList:'$products'},
          //         pipeline:[

          //             {
          //                  $match:{
          //                      $expr:{
          //                          $in:['$_id',"$$proList"]
          //                     }
          //                 }
          //             }
          //         ],
          //         as:'cartItems'
          //     }
          // }
        ])
        .toArray();
      // console.log(cartItems[0].products);
      resolve(cartItems);
    });
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
