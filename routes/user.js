// const { response } = require('express');
var express = require('express');
var router = express.Router();
var productHelper=require('../helpers/product-helpers');
var userHelper=require('../helpers/user-helpers');
var session=require('express-session');
const userHelpers = require('../helpers/user-helpers');
const productHelpers = require('../helpers/product-helpers');
const { log } = require('debug');

const varifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
  }else{
    res.redirect('/login')
  }
}


/* GET home page. */
router.get('/', async function(req, res, next) {
  let user=req.session.user
  console.log('uuuuuuuuuuuuu',user)
  let cartCount=null
  if(req.session.user){
    cartCount=await userHelpers.getCartCount(req.session.user._id)

  }

  productHelper.getAllProducts().then((products)=>{
    let zeroStock = products.filter(product => product.Stocks == 0)
   console.log('============>', zeroStock)
   if(zeroStock.length==0){
    status=false
     
   }else{
    var status=true
   }

  
    console.log("xxx",status);
     
     res.render('user/view-products',{products,user,cartCount,status});


  })
  
  
});
router.get('/login',(req,res)=>{
  if( req.session.loggedIn){
    res.redirect('/')

  }else{
    res.render('user/login',{"loggedErr":req.session.loggedErr})
    // alert('sooooooo')
    
     req.session.loggedErr=false;

  }
  
})
router.get('/signup',(req,res)=>{
  res.render('user/signup')
})
router.post('/signup',(req,res)=>{  //data ethi kainjal dbil store cheyth vekknm
  userHelper.doSignup(req.body).then((response)=>{
    console.log(response)
    req.session.loggedIn=true
    req.session.user=response
    res.redirect('/')
  })
})
router.post('/login',(req,res)=>{
  userHelper.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.loggedIn=true
      req.session.user=response.user
      res.redirect('/')
    }else{
        req.session.loggedErr='invalid user name or password'
       res.redirect('/login')


    }
  })
})
router.get('/logout',(req,res)=>{
  req.session.destroy()
  res.redirect('/signup')
})
router.get( '/cart',varifyLogin,async(req,res)=>{
  
  let products=await userHelper.getCartProducts(req.session.user._id)
  let totalValue=0;
  if(products.length>0){
  
     totalValue=await userHelpers.getTotalAmount(req.session.user._id)

  }
  
  console.log(products);
  res.render('user/cart',{products,user:req.session.user,totalValue})
})
router.get('/add-to-cart/:id',(req,res)=>{ 
   //.....varifyLogin ozhivzkkum for ajax
   console.log('@@@@@@@@@@@@@@@@@@@@@@@@@',req.body);

  console.log('api call')
 
  userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{
    // res.redirect('/')
    res.json({status:true})
  })
})
router.post('/change-product-quantity',(req,res,next)=>{
  console.log('@@@@@@@@@@@@@@@@@@@@@@@@@',req.body);

  userHelpers.changeProductQuantity(req.body).then(async(response)=>{
    
      res.json(response)
  })
  router.post('/delete-cart',(req,res)=>{
    
    
    userHelpers.deleteCart(req.body).then(async(response)=>{
      // response.totalValue=await userHelpers.getTotalAmount(req.body.user)
        res.json(response)
    })
  })
  })
  router.get('/place-order',varifyLogin,async(req,res)=>{
    // let user=req.session.user
    let total=await userHelpers.getTotalAmount(req.session.user._id)
    res.render('user/place-order',{total,user:req.session.user})

  
  })
  router.post('/place-order',async(req,res)=>{
    let products=await userHelpers.getCartProductList(req.body.userId)
    let totalPrice=await userHelpers.getTotalAmount(req.body.userId)
    userHelpers.placeOrder(req.body,products,totalPrice).then((orderId)=>{
      if(req.body['payment-method']==='COD'){
        res.json({codSuccess:true})
       
       
      }else{
        userHelpers.generateRazorPay(orderId,totalPrice).then((response)=>{
          res.json(response)

        })

      }
   
    })
    console.log(req.body);
  })
  router.get('/order-success',(req,res)=>{
    res.render('user/order-success',{user:req.session.user})
  })
  router.get('/orders',async(req,res)=>{
    let orders=await userHelpers.getUserOrder(req.session.user._id)
    res.render('user/orders',{user:req.session.user,orders})
  })
  router.get('/view-order-products/:id',async(req,res)=>{
   let products=await userHelpers. getOrderProducts(req.params.id)
    res.render('user/view-order-products',{user:req.session.user,products})
  })
  router.post('/verify-payment',(req,res)=>{
    console.log(req.body);
    userHelpers.verifyPayment(req.body).then(()=>{
      userHelpers.changePaymentStatus(req.body['order[receipt]']).then(()=>{
        res.json({status:true})

      })
      
    }).catch((err)=>{
      res.json({status:false})
      
    })
  })
  

module.exports = router;
