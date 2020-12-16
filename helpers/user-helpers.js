var db = require("../config/connection");
var collection = require("../config/collections");
const bcrypt = require("bcrypt");
const { response } = require("express");
const { log } = require("debug");
var objectId = require("mongodb").ObjectID;
var Razorpay=require('razorpay');
const { resolve } = require("path");

var instance = new Razorpay({
  key_id: 'rzp_test_pgQGzo0YODK4UM',
  key_secret: 'sx4Wlg35CgXsAhoplpTWYFgv',
});

module.exports = {
  doSignup: (userData) => {
    return new Promise(async (resolve, reject) => {
      userData.Password = await bcrypt.hash(userData.Password, 10);
      db.get()
        .collection(collection.USER_COLLECTION)
        .insertOne(userData)
        .then((data) => {
          resolve(data.ops[0]);
        });
    });
  },
  doLogin: (userData) => {
    let loginStatus = false;
    let response = {};
    console.log(userData);
    return new Promise(async (resolve, reject) => {
      let user = await db.get().collection(collection.USER_COLLECTION).findOne({ Email: userData.Email });
      if (user) {
        bcrypt.compare(userData.Password, user.Password).then((status) => {
          if (status) {
            console.log("suucusfully logined");
            response.user = user;
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
  addToCart: (proId, userId) => {
    let proObj = {
      item: objectId(proId),
      quantity: 1,
    };
    return new Promise(async (resolve, reject) => {
      let userCart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (userCart) {
        let proExist = userCart.products.findIndex((product) => product.item == proId);
        console.log(proExist);
        if (proExist != -1) {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId), "products.item": objectId(proId) },
              {
                $inc: { "products.$.quantity": 1 },
              }
            )
            .then(() => {
              resolve();
            });
        } else {
          db.get()
            .collection(collection.CART_COLLECTION)
            .updateOne(
              { user: objectId(userId) },
              {
                $push: { products: proObj },
              }
            )
            .then((response) => {
              resolve();
            });
        }
      } else {
        let cartObject = {
          user: objectId(userId),
          products: [proObj],
        };
        db.get()
          .collection(collection.CART_COLLECTION)
          .insertOne(cartObject)
          .then((response) => {
            resolve();
          });
      }
    });
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
  },
  getCartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      let count = 0;
      let cart = await db
        .get()
        .collection(collection.CART_COLLECTION)
        .findOne({ user: objectId(userId) });
      if (cart) {
        count = cart.products.length;
      }
      resolve(count);
    });
  },
  changeProductQuantity: (details) => {
    details.count = parseInt(details.count);
    details.quantity = parseInt(details.quantity);

    return new Promise((resolve, reject) => {
      if (details.count == -1 && details.quantity == 1) {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { _id: objectId(details.cart) },
            {
              $pull: { products: { item: objectId(details.product) } },
            }
          )
          .then(() => {
            resolve({ removeProduct: true });
          });
      } else {
        db.get()
          .collection(collection.CART_COLLECTION)
          .updateOne(
            { _id: objectId(details.cart), "products.item": objectId(details.product) },
            {
              $inc: { "products.$.quantity": details.count },
            }
          )
          .then((response) => {
            resolve({ status: true });
          });
      }
    });
  },
  getTotalAmount: (userId) => {
    console.log("******************", userId);

    return new Promise(async (resolve, reject) => {
      let total = await db
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

          {
            $group: {
              _id: null,

              total: { $sum: { $multiply: ["$quantity", "$product.Price"] } },
            },
          },
        ])
        .toArray();
      //  console.log(total[0].total)

      resolve(total[0].total);
    });
  },
  placeOrder: (order,products,total) => {
      return new Promise((resolve,reject)=>{
          console.log(order,products,total);
          let status=order['payment-method']==='COD'?'placed':'pending'
          let orderObject={
              deliveryDetails:{
                  Mobile:order.Mobile,
                  Address:order.Address,
                  Pin:order.Pin
              },
              userId:objectId(order.userId),
              paymentMethod:order['payment-method'],
              products:products,
              totalAmount:total,
              status:status,
              date:new Date()


          }

          db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObject).then((response)=>{
            db.get().collection(collection.ORDER_COLLECTION).removeOne({user:objectId(order.userId)})
              resolve(response.ops[0]._id)
          })
      })

  },
  getCartProductList:(userId)=>{
      return new Promise(async(resolve,reject)=>{
        let cart = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
        resolve(cart.products)
      })
  },
  getUserOrder:(userId)=>{
    console.log(userId);
    return new Promise(async(resolve,reject)=>{
      let orders = await db.get().collection(collection.ORDER_COLLECTION)
      .find({userId:objectId(userId)}).toArray()
      console.log(orders);
      resolve(orders)


    })

  },
  getOrderProducts:(orderId)=>{
    // console.log(userId, "userId");
    return new Promise(async (resolve, reject) => {
      let OrderItem = await db
        .get()
        .collection(collection.ORDER_COLLECTION)
        .aggregate([
          {
            $match: { _id: objectId(orderId) },
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
         
        ])
        .toArray();
      // console.log(cartItems[0].products);
      resolve(OrderItem);
    });

  },
  generateRazorPay:(orderId,total)=>{
    return new Promise((resolve,reject)=>{

      var options = {
        amount: total,  // amount in the smallest currency unit
        currency: "INR",
        receipt:""+ orderId
      };
      instance.orders.create(options, function(err, order) {
        console.log('+++NEW ORDER+++',order);
        resolve(order)
      });
    })

  },
  verifyPayment:(details)=>{
    return new Promise((resolve,reject)=>{
      const crypto = require('crypto');
      let hamc = crypto.createHmac('sha256', 'sx4Wlg35CgXsAhoplpTWYFgv')
      hamc.update(details['payment[razorpay_order_id]']+'|'+details[ 'payment[razorpay_payment_id]'])
      hamc=hamc.digest('hex')
      if(hamc==details['payment[razorpay_signature]']){
        resolve()

      }else{
        reject()
      }

    })
  },
  changePaymentStatus:(orderId)=>{
    return new Promise((resolve,reject)=>{
      db.get().collection(collection.ORDER_COLLECTION)
      .updateOne({_id:objectId(orderId)},
      {
        $set:{
          status:'placed'
        }
      }
      
      ).then(()=>{
        resolve()
      })
    })

  }
 
 

};


























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
