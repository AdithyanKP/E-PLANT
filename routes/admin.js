var express = require('express');



var router = express.Router();

const mysqlConnection=require('../config/connections ');

const verifyLogin=(req,res,next)=>{
  if(req.session.adminloggedIn){
    next()
  }else{
    res.redirect('/admin/adminlogin')
  }

}
/* GET users listing. */
router.get('/', function(req, res, next) {
  let adminlogin=req.session.adminlogin
  console.log(adminlogin);
  res.render('admin/welcome',{admin:true,adminlogin});
});
router.get('/allproducts',verifyLogin,(req,res)=>{
  let adminlogin=req.session.adminlogin
  var sql="SELECT * FROM all_product";
  mysqlConnection.query(sql,(err,rows,fields)=>{
    if (err) throw err;
    console.log(rows);
    res.render('admin/allproducts',{ admin:true,rows,adminlogin})
  })

  
})
router.get('/add-products',(req,res)=>{
  res.render('admin/add-products',{admin:true})
})
router.post('/add-products',(req,res)=>{
  console.log(req.body);
  console.log(req.files.Image);
  const userDeatails=req.body;
  var sql="INSERT INTO all_product SET ?";
  mysqlConnection.query(sql,userDeatails,(err,rows,fields)=>{
    if (err) throw err;
    console.log(rows.insertId);
  
    let image=req.files.Image
    let insertId=rows.insertId
  image.mv('./public/product-images/'+insertId+'.jpeg',(err)=>{
    
    
      
      if(err){
        console.log("error"+err);
      }
      else{
        
        res.render('admin/add-products',{admin:true})
      }
    })
    
  })
  
})
router.get('/delete-product/:id',(req,res)=>{
  let proId=req.params.id
  console.log(proId);
  var sql="DELETE FROM all_product WHERE id=?";
  mysqlConnection.query(sql,proId,(err,result)=>{
    if (err) throw err;
    console.log("nuumber of record deleted:"+result.affectedRows);
    res.redirect('/admin/allproducts')
  })
  

})
router.get('/edit-product/:id',verifyLogin,(req,res)=>{
  let adminlogin=req.session.adminlogin
  let proId=req.params.id
  var sql="SELECT * FROM all_product WHERE id=?";
  mysqlConnection.query(sql,proId,(err,result)=>{
    if (err)throw err;
    console.log(result);
    res.render('admin/edit-product',{admin:true,result,adminlogin})
  })

  
})
router.post('/edit-product/:id',(req,res)=>{
 const proDeatails=req.body;
 console.log(proDeatails.Name);
 let proId=req.params.id;
 console.log(proId);
 mysqlConnection.query("UPDATE all_product SET ? WHERE id=?",[proDeatails,proId],(err,result,fields)=>{
   if (err) throw err;
   res.redirect('/admin/allproducts')
   if(req.files.Image){
     let image=req.files.Image

    image.mv('./public/product-images/'+proId+'.jpeg')
     

   }
 
 })
})
router.get('/adminlogin',(req,res)=>{
  if(req.session.adminloggedIn){
    res.redirect('/admin')
  }else{
    res.render('admin/adminlogin',{admin:true,'adminloginErr':req.session.adminloginErr})
    req.session.adminloginErr=false
  }
})
router.post('/adminlogin',(req,res)=>{
  const email=req.body.Email;
  const password=req.body.Password;
  mysqlConnection.query("SELECT * FROM admin_login WHERE email = ?",email,(err,result)=>{
    
      console.log(result);
    
    if(result.length >0){
     mysqlConnection.query("select * from admin_login where password=?",password,(err,result)=>{

        if (result.length >0){
          console.log("login success");
          
          req.session.adminlogin=result
          req.session.adminloggedIn=true
          res.redirect('/admin')
        }else{
          console.log("login failed");
          req.session.adminloginErr="Incorrect password"
          
          res.redirect('/admin/adminlogin')
        }
      })
    }else{
      console.log("Invalid Email");
      req.session.adminloginErr="Invalid Email"
      res.redirect('/admin/adminlogin')
    }

  })
})
router.get('/adminlogout',(req,res)=>{
  req.session.adminlogin=null
  req.session.adminloggedIn=false
  res.redirect('/admin')
})
router.get('/allorders',verifyLogin,(req,res)=>{
  let adminlogin=req.session.adminlogin
  mysqlConnection.query("select * from order_table ",(err,result)=>{
    if (err) throw err;
    console.log(result);
    res.render('admin/allorders',{admin:true,result,adminlogin})
  })

})
router.get('/ship-order/:id',(req,res)=>{
  let orderId=req.params.id
  mysqlConnection.query("update order_table set status='shipped' where id=? ",orderId,(err,result)=>{
    if (err) throw err;
    res.redirect('/admin/allorders')
    
  })


})
router.get('/cancel-order/:id',(req,res)=>{
  let orderId=req.params.id
  mysqlConnection.query("delete from order_table where id=?",orderId,(err,result)=>{
    if (err) throw err;
    res.redirect('/admin/allorders')
  })
})
router.get('/all-users',verifyLogin,(req,res)=>{
  let  adminlogin=req.session.adminlogin
  mysqlConnection.query('select * from user_signup',(err,result)=>{
    if (err) throw err;
    res.render('admin/all-users',{admin:true,result,adminlogin})
  })
})
  
module.exports = router;
