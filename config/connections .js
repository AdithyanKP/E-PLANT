const mysql=require('mysql');
var mysqlConnection =mysql.createConnection({
    host:"localhost",
    user:"root",
    password:"fox123",
    database:"allproduct",
    multipleStatements:true
  });
  
  mysqlConnection.connect((err)=>{
    if(err)
    {
      console.log("connection failes"+err);
    }
    else{
      console.log("connection successfull");
    }
  });

  module.exports = mysqlConnection;


 

    
