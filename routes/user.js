var express = require('express');
var router = express.Router();
const mysqlConnection=require('../config/connections ');
const bcrypt=require('bcrypt');
const { response } = require('express');
const Razorpay=require('razorpay')
var instance = new Razorpay({
  key_id: 'rzp_test_lrdoYdP6ZvdfDU',
  key_secret: 'mReRLB0oRcWcID95dADJ7pUU',
});
const verifyLogin=(req,res,next)=>{
  if(req.session.userloggedIn){
    next()
  }else{
    res.redirect('/login')
  }

}


/* GET home page. */
router.get('/', function(req, res, next) {
  let user=req.session.user
  console.log(user);
  res.render('user/homepage', { admin:false,user});
});
router.get('/all-products',verifyLogin,function(req,res){
  let user=req.session.user
  var sql="SELECT * FROM all_product";
  mysqlConnection.query(sql,(err,rows,fields)=>{
    if (err) throw err;
    console.log(rows);
  
  res.render('user/all-products',{rows,user})
  })
})
router.get('/login',(req,res)=>{
  if(req.session.userloggedIn){
    res.redirect('/')
  }else{
    res.render('user/login',{'loginErr':req.session.userloginErr})
    req.session.userloginErr=false
  }
})
router.get('/signup',(req,res)=>{
  res.render('user/signup')
})


router.post('/signup',(req,res)=>{
    const  users=req.body;
    return new Promise(async(resolve,reject)=>{
      users.password= await bcrypt.hash(users.password,10)
  var sql="INSERT INTO user_signup SET ?";
  mysqlConnection.query(sql,users,(err,data,fields,message)=>{ 
    if (err)throw err;
    
    console.log(data);
    res.redirect('/login')
  })
  })
})

router.post('/login',(req,res)=>{
  const email=req.body.Email;
  const password=req.body.Password;
  mysqlConnection.query("SELECT * FROM user_signup WHERE Email = ?",email,(err,result)=>{
    
      console.log(result);
    
    if(result.length >0){
      bcrypt.compare(password,result[0].Password,(err,response)=>{
        
        if (response){
          console.log("login success");
          
          req.session.user=result
          req.session.userloggedIn=true
          res.redirect('/')
        }else{
          console.log("login failed");
          req.session.userloginErr="Incorrect password"
          
          res.redirect('/login')
        }
      })
    }else{
      console.log("Invalid Email");
      req.session.userloginErr="Invalid Email"
      res.redirect('/login')
    }

  })
})

 


router.get('/faq',(req,res)=>{
  res.render('user/faq')
})
router.get('/privacy-policy',(req,res)=>{
  res.render('user/privacy-policy')
})
router.get('/terms-condition',(req,res)=>{
  res.render('user/terms-condition')
})
router.get('/logout',(req,res)=>{
  req.session.user=null
  req.session.userloggedIn=false
  res.redirect('/')

})
router.get('/cart',verifyLogin,(req,res)=>{
  let user=req.session.user
  let userID=req.session.user[0].id 
  mysqlConnection.query("SELECT * FROM cart WHERE userId=?",userID,(err,result)=>{
    if (err) throw err;
    console.log(result);
    if (result.length>0){ 
    var sql="select  sum((price)*(quantity)) as total from all_product,cart where cart.productId=all_product.id and userId=?";
     mysqlConnection.query(sql,userID,(err,result)=>{
        if (err) throw err;
        console.log(result);
        let total=result;
        
    var sql="select userId,all_product.id,all_product.Name,all_product.price,cart.quantity from all_product,cart where  cart.productId=all_product.id and userId=?  ";
    mysqlConnection.query(sql,userID,(err,result)=>{
      if (err) throw err;
      console.log(result);
       res.render('user/cart',{result,user,total})
    })
     
  
  })
}else{
  res.redirect('/all-products')
}
  })
  
})
router.get('/add-to-cart/:id',verifyLogin,(req,res)=>{
 const  proId=req.params.id
  let userID=req.session.user[0].id
  console.log("api call");
  

  console.log(userID);
  
      mysqlConnection.query("SELECT * FROM cart WHERE userId=?",userID,(err,result)=>{
        if (err) throw err;
        console.log(result);
        if(result.length>0){
          mysqlConnection.query("SELECT * FROM cart WHERE productId=? AND userId=?",[proId,userID],(err,result)=>{
            if (err) throw err;
            console.log(result);
             if(result.length>0){
              mysqlConnection.query("Update cart set quantity=quantity+1 where userId=? AND productId=? ",[userID,proId],(err,result)=>{
                if (err)throw err;
                res.redirect('/all-products')
              })
            }else{
              let cartObj={
                userId:userID,
                productId:[proId],
                quantity:1
                
              }
              console.log(cartObj);
              console.log(userID);
               mysqlConnection.query("INSERT INTO cart SET ?",cartObj,(err,result)=>{
                    if (err) throw err;
                    res.redirect('/all-products')
                  })
              
            }
          })
          
          
        }else{
          let cartObj={
            userId:userID,
            productId:[proId],
            quantity:1
            
          }
          
           mysqlConnection.query("INSERT INTO cart SET ?",cartObj,(err,result)=>{
                if (err) throw err;
                res.redirect('/all-products')
              })
          

        }

        
      })
      
})
router.post('/change-product-quantity',(req,res,next)=>{
  const proDeatails=req.body;
  proDeatails.count=parseInt(proDeatails.count)
  proDeatails.quantity=parseInt(proDeatails.quantity)
  let proId=proDeatails.product
  let userId=proDeatails.user
  let removeProduct=false
  let count=proDeatails.count;
  
  
  console.log(proDeatails);
  if(proDeatails.count==-1 && proDeatails.quantity==1){
    mysqlConnection.query("delete from cart where userId=? and productId=?",[userId,proId],(err,result)=>{
      if (err) throw err;
      console.log(result);
      res.json({result,removeProduct:true})
      
    })
  }else{ 
  
   if(proDeatails.count>0){ 
    
    mysqlConnection.query("Update cart set quantity=quantity+1 where productId=? AND userId=?",[proId,userId],(err,result)=>{
    if (err)throw err;
    console.log(result);
    
    var sql="select  sum((price)*(quantity)) as total from all_product,cart where cart.productId=all_product.id and userId=?";
     result.total=mysqlConnection.query(sql,userId,(err,result)=>{
        if (err) throw err;
        console.log(result);
        
        
    res.json(result)
  })
    })

}else{
  mysqlConnection.query("Update cart set quantity=quantity-1 where productId=? AND userId=?",[proId,userId],(err,result)=>{
    if (err)throw err;
    console.log(result);
    var sql="select  sum((price)*(quantity)) as total from all_product,cart where cart.productId=all_product.id and userId=?";
     result.total=mysqlConnection.query(sql,userId,(err,result)=>{
        if (err) throw err;
        console.log(result)
    res.json(result);
  })
})

}
  }
  
  
})
router.get('/delete-cart/:id',(req,res)=>{
  let proID=req.params.id
  let userID=req.session.user[0].id
  console.log(proID);
  mysqlConnection.query("delete from cart where userId=? and productId=?",[userID,proID],(err,result)=>{
    if (err) throw err;
    res.redirect('/cart')
  })
})
router.get('/place-order',verifyLogin,(req,res)=>{
  let user=req.session.user
  let userID=req.session.user[0].id 
  mysqlConnection.query("SELECT * FROM cart WHERE userId=?",userID,(err,result)=>{
    if (err) throw err;
    console.log(result);
    let users=result;
    var sql="select userId,all_product.id,all_product.Name,all_product.price,cart.quantity from all_product,cart where  cart.productId=all_product.id and userId=?  ";
    mysqlConnection.query(sql,userID,(err,result)=>{
      if (err) throw err;
      console.log(result);
      var sql="select  sum((price)*(quantity)) as total from all_product,cart where cart.productId=all_product.id and userId=?";
     mysqlConnection.query(sql,userID,(err,result)=>{
        if (err) throw err;
        console.log(result);
         
        res.render('user/place-order',{user,result,users})
        
      })
  
  
  })
})
})
router.post('/place-order',(req,res)=>{
    console.log(req.body);
    const order=req.body;
    let userID=req.session.user[0].id
    let Address=order.address
    let Pincode=order.pincode
    let Mobile=order.mobile
    let product=order.products
    let Paymentmethod=order['payment-method']
    let Total=order.total
    
    console.log(userID);
    console.log(order.address);
    let status=order['payment-method']==='COD'?'placed':'pending'
    let orderObj={
      userId:userID,
      address:Address,
      pincode:Pincode,
      mobile:Mobile,
      total:Total,
      paymentmethod:Paymentmethod,
      status:status,
      date:new Date()
      
    }
    console.log(orderObj);
    mysqlConnection.query("insert into order_table set?",orderObj,(err,result)=>{
      if (err) throw err;
      console.log(result);
      mysqlConnection.query("SELECT LAST_INSERT_ID() AS orderId FROM order_table ",(err,result)=>{
      if (err) throw err;
      
      let orderID=result[0].orderId
      
     
        mysqlConnection.query("delete from cart where userId=?",userID,(err,result)=>{
        if (err) throw err;
       console.log(result);
       if (Paymentmethod==='COD'){
        res.json({result,codSuccess:true})
       }else{
        var options = {
          amount: Total*100,  // amount in the smallest currency unit
          currency: "INR",
          receipt:""+orderID
        };
        instance.orders.create(options, function(err, order) {
          if (err){
            console.log(err);
          }else{ 
          console.log("New  Order:",order);
          res.json(order)
          }
        });
          
       }
       
        
       
      
    })
  
  })
   })
})
router.get('/order-success',verifyLogin,(req,res)=>{
  let user=req.session.user;
  res.render('user/order-success',{user})
})
router.get('/orders',verifyLogin,(req,res)=>{
  let user=req.session.user
  let userID=req.session.user[0].id
  mysqlConnection.query("select * from order_table where userId=?",userID,(err,result)=>{
    if (err) throw err;
    console.log(result);
    res.render('user/orders',{user,result})
  })

})
router.post('/verify-payment',(req,res)=>{
  console.log(req.body);
  let deatails=req.body
  let orderId=deatails['order[receipt]']
 
  const crypto=require('crypto');
  let hmac = crypto.createHmac('sha256', 'mReRLB0oRcWcID95dADJ7pUU')


  hmac.update(deatails['payment[razorpay_order_id]']+'|'+deatails['payment[razorpay_payment_id]']);
  hmac=hmac.digest('hex')
  if(hmac==deatails['payment[razorpay_signature]']){ 
    
    mysqlConnection.query("update order_table  set status='placed' where id=?",orderId,(err,result)=>{
      if (err) throw err;
      console.log(result);
      console.log("Payment  succsesfull");
      res.json({result,status:true}) 
    })
  }else{
    console.log("hgee");
  }
})
router.get('/cancel-order/:id',(req,res)=>{
  let orderId=req.params.id
  mysqlConnection.query("update order_table set status='Cancelled' where id=? and paymentmethod='COD'",orderId,(err,result)=>{
    if (err) throw err;
    res.redirect('/orders')

  })

})
router.post('/homepage',(req,res)=>{
  console.log(req.body);
  let details=req.body
  let newsletterObj={
    id:1,
    Email:details.Email
  }
  mysqlConnection.query("Insert into news_letter Set?",newsletterObj,(err,result)=>{
    if (err) throw err;
    res.redirect('/')
  })
})

module.exports = router;
