var db =require('../config/connection')
var collection=require('../config/collections')
// const { ObjectID } = require('mongodb')
// const { response } = require('../app')
var objectId=require('mongodb').ObjectID


module.exports={
    addProduct: (product,callback)=>{
      
       product.Price=parseInt(product.Price)
       product.Stocks=parseInt(product.Stocks)
       
       
        db.get().collection('product').insertOne(product).then((data)=>{
            // db.Price=parseInt(Price)
            // console.log(Price)
            // console.log(data.Price);
            callback(data.ops[0]._id)
        })
    },
    getAllProducts:()=>{
        return new Promise(async(resolve,reject)=>{
            let products=await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            let zeroStock = products.filter(product => product.Stocks == 0)
            resolve(products)
           
        })
    },
    deleteProduct:(proId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).removeOne({_id:objectId(proId)}).then((response)=>{
                resolve(response)
            })
        })

    },
    getProductDetails:(proId)=>{
       

        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(proId)}).then((product)=>{
                resolve(product)
            })

        })

    },
    updateProduct:(proId,productDetails)=>{
        productDetails.Price=parseInt(productDetails.Price)
       
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION)
            .updateOne({_id:objectId(proId)},{
                $set:{
                    Name:productDetails.Name,
                    Category:productDetails.Category,
                    Price:productDetails.Price,
                    Stocks:productDetails.Stocks,
                    Description:productDetails.Description
                }
            }).then((response)=>{
                resolve()
            })
        })
    }
}