// const { response } = require("express")

function addToCart(proId,proStok,proDis){
   
    let disable = document.getElementById('disable')
if(proStok==0){
   
    disable.style.display='block'
    // alert('product is unavailable')
    
    // document.getElementById(proDis).disabled = true;
   
    xhr.abort()
    
}

        
   var xhr= $.ajax({
        url:'/add-to-cart/'+proId,
        // data:{
        //     proStok:proStok,
        //     proDis:proDis

        // },
       
        method:'get',
        success:(response)=>{
            if(response.status){
                let count=$('#cart-count').html()
                count=parseInt(count)+1
                $('#cart-count').html(count)
            }
                
            }
       
    })
    
}