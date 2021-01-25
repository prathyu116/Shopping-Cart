var express = require('express');
const {render, response} =require('../app');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
var productHelper=require('../helpers/product-helpers');
var adminHelper=require('../helpers/admin-helpers');
var session=require('express-session');

/* GET users listing. */
router.get('/', function(req, res, next) {
  let admin=req.session.admin
  console.log('pppppppppppp',admin);
  // res.render('admin/admin-login')
  // productHelper.getAllProducts().then((products)=>{
  //   console.log(products)
  //   res.render('admin/view-product',{adminval:true,products});


  // })
  
  if( req.session.loggedIn){
    productHelper.getAllProducts().then((products)=>{
    res.render('admin/view-product',{adminval:true,products,admin});
  })

  }else{
    res.render('admin/admin-login',{"loggedErr":req.session.loggedErr,adminval:true})
    // alert('sooooooo')
     req.session.loggedErr=false;

  }
});
router.post('/',(req,res)=>{
  adminHelper.doLogin(req.body).then((response)=>{
    console.log('===========',response)
    if(response.status){
      req.session.loggedIn=true
      req.session.admin=response.admin //response nn varunna data session il store
      console.log('nnnnnnnnnnnnnnnnn', req.session.admin);
      res.redirect('http://localhost:3000/admin')
    }else{
        req.session.loggedErr='invalid user name or password'
       res.redirect('http://localhost:3000/admin')


    }
  })
})
router.get('/logoutadmin',(req,res)=>{
  req.session.destroy()
  res.redirect('http://localhost:3000/admin')
})
router.get('/add-product',function(req,res){
  res.render('admin/add-product')
})
router.post('/add-product',(req,res)=>{
   console.log(req.body)
  // console.log(req.files.Image) //just console il imgum aa contentum varan
  productHelper.addProduct(req.body,(id)=>{

    console.log(req.body)
    // let Price=parseInt(products.Price)
    let image=req.files.Image;
    image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{ //, move cheyth kainjal
      if (!err){
        res.render('admin/add-product')

      }
      else{
        console.log(err)
      }
      
    })
  
  })
})
router.get('/delete-product/:id',(req,res)=>{
  let proId=req.params.id
  console.log(proId);
  productHelpers.deleteProduct(proId).then((response)=>{
    res.redirect('/admin/')
  })
})
router.get('/edit-product/:id',async(req,res)=>{
  let product=await productHelpers.getProductDetails(req.params.id)
  console.log(product)
  res.render('admin/edit-product',{product})

})
router.post('/edit-product/:id',(req,res)=>{
  

  let id=req.params.id
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin')
    if(req.files.Image){
      let image=req.files.Image

     
      image.mv('./public/product-images/'+id+'.jpg')
    }

  })
})

module.exports = router;
