const db=require("../config/connections");
const userData=require("../models/user");
const nodeMailer=require('nodemailer')
const cart = require("../models/cart");
const bcrypt=require("bcrypt");
const { promise, reject } = require("bcrypt/promises");
const async = require("hbs/lib/async");
const { status } = require("express/lib/response");
const adminDatas = require("../models/adminData");
const productData = require("../models/productData");
const wishlistModel=require("../models/wishlist")
const orderModel = require("../models/order");
const  couponmodel= require('../models/Coupon')
const { Mongoose, default: mongoose } = require("mongoose");
const { compileTrust } = require("express/lib/utils");
const Razorpay = require('razorpay');
require('dotenv').config()





const instance = new Razorpay({
  key_id: process.env.RAZORPAY_ID,
  key_secret: process.env.RAZORPAY_KEY,
});



module.exports={
    doSignup:(doData)=>{
        return new Promise(async ( resolve,reject)=>{
            const user =await userData.findOne({email:doData.email});
            if(user){
                reject({status:false,msg:"Email already taken"});
            } else{
                doData.password=await bcrypt.hash(doData.password,10);

                const otpGenerator = await Math.floor(10000+Math.random()*9000);
                const newUser= await {
                    name: doData.name,
                    phone: doData.phone,
                    email: doData.email,
                    password: doData.password,
                    otp: otpGenerator,
                };
                console.log(newUser);
                if(newUser){
                    try{
                        const mailTransporter = nodeMailer.createTransport({
                            host: "smtp.gmail.com",
                            service: "gmail",
                            port: 465,
                            secure: true,
                            auth:{
                                user: process.env.NODEMAILER_USER,
                                pass: process.env.NODEMAILER_PASS,
                            },
                            tls:{
                                rejectUnauthorized: false,
                            },
                        });

                        const mailDetails ={
                            from: "muhammedsinana1a1@gmail.com",
                            to: doData.email,
                            subject:"Book spot signup verification",
                            text: "just random texts",
                            html: "<p> hi " + doData.name + " your otp " + otpGenerator + "",

                        };
                        mailTransporter.sendMail(mailDetails,(err,Info)=>{
                            if(err){
                                console.log(err);
                            }else{
                                console.log("email has been sent",Info.response);
                            }
                        });
                    }catch(err){
                        console.log(err.message);
                    }
                }
                resolve(newUser);
            }
        });
    },

    doLogin: (userDataaa) => {
        console.log(userDataaa);
        return new Promise(async (resolve, reject) => {
          let loginStatus = false;
          let response = {};
          let user = await userData.findOne({ email: userDataaa.email });
          // let admin= await adminData.findOne({email:userDataaa.email})
          // console.log(userData);
          // console.log(user.email);
    
          if (user) {
            
            console.log(user);
            if(user.block){
              reject({status:true,msg:"your account has been blocked"})
            }else{
              console.log(user);
            }
            
            console.log(userDataaa.password);
            console.log(user.password);
            bcrypt.compare(userDataaa.password, user.password).then((status) => {
              if (status) {
                console.log("Login Success!");
                response.user = user;
                response.status = true;
                resolve(response);
                console.log(response + "1234");
              } else {
                console.log("Login Failed");
                reject({ status: false, msg: "Password not matching!" });
              }
            });
          } else {
            console.log("Login Failed");
            reject({ status: false, msg: "Email not registered, please sign up!" });
          }
        });
      },

      doresetPasswordOtp: (resetData) => {
        return new Promise(async (resolve, reject) => {
          const user = await userData.findOne({ email: resetData.email });
          
          console.log(user);
          if (user) {
            // resetData.password = await bcrypt.hash(resetData.password, 10);
    
            const otpGenerator = await Math.floor(1000 + Math.random() * 9000);
            const newUser = await {            
              email: resetData.email,
              otp: otpGenerator,
              _id:user._id
              
            };
            console.log(newUser);
    
            try {
              const mailTransporter = nodeMailer.createTransport({
                host: "smtp.gmail.com",
                service: "gmail",
                port: 465,
                secure: true,
                auth: {
                  user: "muhammedsinana1a1@gmail.com",
                  pass: "ywldqwwnmatvaeeh",
                },
                tls: {
                  rejectUnauthorized: false,
                },
              });
    
              const mailDetails = {
                from: "muhammedsinana1a1@gmail.com",
                to: resetData.email,
                subject: " signup verification",
                text: "just random texts ",
                html: "<p>Hi " + "user, " + "your otp for resetting MyKitchen account password is " + otpGenerator+".",
              };
              mailTransporter.sendMail(mailDetails, (err, Info) => {
                if (err) {
                  console.log(err);
                } else {
                  console.log("email has been sent ", Info.response);
                }
              });
            } catch (error) {
              console.log(error.message);
            }
    
            resolve(newUser);
    
    
          } else {
            reject({ status: false, msg: "Email not registered, please sign up!" });
          }
        });
      },
    

      doresetPass: (rData,rid) => {
        console.log(rData);
        return new Promise(async (resolve, reject) => {
          let response = {};
          rData.password = await bcrypt.hash(rData.password, 10);
          // console.log(rData.password+'fi');
          // console.log(userData.email+"aa");
    
          let userId =rid
          console.log(userId+'12');
          let resetuser = await userData.findByIdAndUpdate({_id:userId},
            {$set:{password:rData.password}})
    
          // let user = await userData.findOne({ email: rData.email });
          // // let admin= await adminData.findOne({email:userDataaa.email})
          // // console.log(userData);
          // // console.log(user.email);
    resolve(resetuser)
          
      })
    },
    //---------------------------------------------//
    getSingleProduct:(data)=>{
      return new Promise(async(resolve,reject)=>{
    
      await productData.findOne({_id:data}).populate('Category').populate('Sub_category').lean().then((product)=>{
        resolve(product)
        })
        
       
      })
    },
    
//--------------------------------------------------------------------------------------------------------------//
addToCart: (proId, userId) => {
  return new Promise(async (resolve, reject) => {
    const alreadyCart = await cart.findOne({ user_Id: userId });
    const product = await productData.findById({ _id: proId });
    if (alreadyCart) {
      let proExist = alreadyCart.products.findIndex(
        (products) => products.pro_Id == proId);
      if (proExist != -1) {
        console.log(proExist);
        cart
          .updateOne(
            { "products.pro_Id": proId, user_Id: userId},
            {
              $inc: { "products.$.quantity": 1 },
            }
          )
          .then((response) => {
            console.log("11111111111111111111111");
            resolve();
          });
      } else {
        await cart
          .findOneAndUpdate(
            { user_Id: userId },
            { $push: { products: { pro_Id: proId, MRP: product.MRP ,productName:product.Product_Name} } }
          )
          .then(async (res) => {
            resolve({ msg: '"Added", count: res.product.length + 1 ' });
          });
      }
    } else {
      const newcart = new cart({
        user_Id: userId,
        products: { pro_Id: proId, MRP: product.MRP,productName:product.Product_Name },
      });
      await newcart.save((err, result) => {
        if (err) {
          resolve({ error: "cart not created" });
        } else {
          resolve({ msg: "cart created", count: 1 });
        }
      });
    }
  });
},

//----------------------------------------------------------------------------------------------------------------//

getProductDetails: (proId) => {
  console.log(proId);
  return new Promise(async (resolve, reject) => {
    const product = await productData.findOne({_id: proId })
      .lean()
      .then((product) => {
        // console.log(product);
        resolve(product);
      });
  });
}, 
//---------------------------------------------------------------------------------------------------------------//
getProductDetails: (proId) => {
  console.log(proId);
  return new Promise(async (resolve, reject) => {
    const product = await productData.findOne({_id: proId })
      .lean()
      .then((product) => {
        // console.log(product);
        resolve(product);
      });
  });
}, 


getCartItems: (userId) => {
  return new Promise(async (resolve, reject) => {
   let cartItem = await cart
      .findOne({ user_Id: userId })
      .populate("products.pro_Id")
      .lean();
    resolve(cartItem);
  });
},


//--------------------------------------------------------------------------------------------------------------//
getCartCount: (userid) => {
  return new Promise(async (resolve, reject) => {
     let count=0
    const user = await cart.findOne({ user: userid });
    if (user) {
      count = user.products.length;
      resolve(count);
    }else{
     
      resolve(count)
    }
  });
},


getWishlistcount: (userId) => {
  return new Promise(async (resolve, reject) => {
    let count = 0;
    const user = await wishlistModel.findOne({ user_Id: userId });
    if (user) {
      count = user.products.length;
      resolve(count);
    } else {
      resolve(count);
    }
  });
},







//--------------------------------------------------------------------------------------------------------------//
changeProductQuantity:(data,user) => {
  return new Promise(async (resolve, response) => {
 const procount = parseInt(data.count);
 console.log(user);
 console.log(data);
 console.log(procount);
 console.log(data.product);
 console.log(data.cartid);
   if(procount==-1&&data.quantity==1){
     await cart.findOneAndUpdate( {user_Id: user._id},
     {
       $pull:{products:{_id:data.cartid  }}            
     }).then((response)=>{             
       resolve({removeProduct:true}) 
     })  
   }else{
     await cart.findOneAndUpdate(
       { user_Id: user._id, "products.pro_Id": data.product },
     { $inc: { "products.$.quantity": procount } 
     }).then((response)=>{
       console.log("+.............................");
       resolve(true);
     });
   }
 })
},

// ------------------------------------------------------------------

subTotal:(user)=>{
  let id=mongoose.Types.ObjectId(user);
  return new Promise(async(resolve,reject)=>{
   const amount = await cart.aggregate([
{
    $match:{user_Id:id},
},
{
    $unwind:"$products",
},
{
  $project: {
    id: "$products.pro_Id",
    total: { $multiply: ["$products.MRP", "$products.quantity"] },
  },
},
   ]);
   console.log("00000000000000000000000000000000000000000000000000")
   console.log(amount);
   let cartData= await cart.findOne({user_Id:id});
   if(cartData){
     amount.forEach(async(amt)=>{
       await cart.updateMany(
         { "products.pro_Id": amt.id},
        {$set: { "products.$.subTotal": amt.total }}
        );
     });
     resolve();
   }
  });
},






removeProductFromCart:(data,user)=>{
  return new Promise(async(resolve,reject)=>{
await cart.findOneAndUpdate({user_Id:user._id},
  {
    $pull:{products:{_id:data.cartid }} 
  }).then((response)=>{ 
    resolve({removeProduct:true}) 
  })  
})
},

// --------------------------Delivery Charge-------------------------------------
      
deliveryCharge:(amount)=>{
  console.log(amount+'total');
  return new Promise((resolve,reject)=>{
      if(amount>1000){
        resolve(60)
      }if(amount>5000){
        resolve(100)
      }else{
        resolve(0)
      }
  })
},

// -------------------------------------------grandTTotal------------------------------------------------

grandTotal:(netTotal,deliveryCharge)=>{
  return new Promise((resolve,reject)=>{
    const grandTotal=netTotal+deliveryCharge
    resolve(grandTotal)
    console.log(grandTotal)
  })
},



// -----------------------------------------total amount-----------------------------------------------------------------------------
   

totalAmount:(userData)=>{
  // console.log(userData);
  const id=mongoose.Types.ObjectId(userData);
  return new Promise(async(resolve,reject)=>{
    const total=await cart.aggregate([ 
      {
        $match:{user_Id:id},
      },
      {
        $unwind:'$products',
      },
      {
        $project:{
          quantity:'$products.quantity',
          MRP:'$products.MRP'
        },
      },
      {
        $project:{
          productname:1,
          quantity:1,
          MRP:1,
        },
      },
      {
        $group: {
          _id:null,
          total:{ $sum: { $multiply: ['$quantity','$MRP']}},
        },
      },

    ]);
      console.log("total amount");
    if(total.length ==0){
   resolve({status:true});
    }else{
      let grandTotal=total.pop();
    resolve({grandTotal,status:true}) 
  }
  })


},

// ------------------------place order------------------------------------------------------

placeOrder:(order,cartItem,grandTotal,deliveryCharge,netTotal,user)=>{
  const mainTotal=parseInt(order.mainTotal)
  console.log("sdkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk");
  console.log(order.mainTotal)
  return new Promise(async(resolve,reject)=>{       
   const status=order.paymentMethod==='cod'?'placed':'pending' 
  //  const status=order.paymentMethod==='cod'?'placed':'pending'

  // inserting valuesfrom body to order collection
   const orderObj=await orderModel({
     user_Id:user._id,
     Total:netTotal,
     ShippingCharge:deliveryCharge,
     grandTotal:grandTotal,
     mainTotal:mainTotal,
     discountedPrice:order.discountedPrice,
     payment_status:status, 
     paymentMethod:order.paymentMethod,
     ordered_on:new Date(),
     product:cartItem.products,
     deliveryDetails:{ 
       name:order.name, 
       number:order.number,
       email:order.email, 
       house:order.house,
       localplace:order.localplace,
       town:order.town,
       district:order.district,
       state:order.state,
       pincode:order.pincode     
     }    
   })
   await orderObj.save(async(err,res)=>{
    await cart.remove({user:order.userId})
     resolve(orderObj); 
   })    
})
},


//------------------------------------------------getorderProducts---------------------------------------------//
// getorderProducts:(orderid)=>{
//   console.log(orderid);
//   return new Promise(async(resolve,reject)=>{
//       const orderdetails=await orderModel.findOne({_id:orderid}).populate("product.pro_Id").lean()
//       console.log(orderdetails);
//       console.log("8888888888888888888888888888555555555555555");
//       resolve(orderdetails)
//   })   
// },

//--------------------------------------------------getAllOrderList--------------------------------------------//
getAllOrderList: (userId) => {
  console.log(userId,"hello user id")
  return new Promise(async (resolve, reject) => {
   let orderList = await orderModel
      .find({ user_Id: userId })
      .populate("product.pro_Id")
      .lean();
    resolve(orderList);
  });
},


userprofile:(userid)=>{
  return new Promise (async(resolve,reject)=>{
  const user=await userData.findOne({_id:userid}).lean()

    resolve(user)
 
})
  },
        //  -----------------------------------------------------

        getorderProducts:(orderid)=>{
          console.log(orderid);
          return new Promise(async(resolve,reject)=>{
              const orderdetails=await orderModel.findOne({_id:orderid}).populate("product.pro_Id").lean()
              // console.log(orderdetails);
              resolve(orderdetails)
          })   
        },
    
    
        // cancelorder:(data)=>{
        //   console.log("-----------------");
        //   console.log(data);
        //   const status='Cancelled'
        //   return new Promise (async(resolve,reject)=>{
        //     const cancelorder=await orderModel.findOneAndUpdate({_id:data.orderId,'product.pro_Id':data.proId},
        //     {
        //      $set:{
        //       "product.$.status":status
        //     }
        //   },
        //   )
        //   // await productData.findOneAndUpdate({_id:data.proId},
        //   //   {
        //   //     // $inc:{
        //   //     //   Stoke:1
        //   //     // }
        //   //   })
        //   resolve()
      
        //   })
        // },


        cancelorder:(data)=>{
          orderId = mongoose.Types.ObjectId(data.orderId);
          proId = mongoose.Types.ObjectId(data.proId);
          console.log("print")
          console.log(orderId+"orderId")
          console.log(proId+"proId")
          const status = "Cancelled";
          return new Promise(async(resolve,reject)=>{
            const cancelorder = await orderModel.updateMany(
              {_id:orderId,"product._id":proId},
              {$set:
                {
                  "product.$.status":status,
                  "product.$.orderCancelled":true,
                }}
            )
            console.log(cancelorder,"inside cancel order")
            resolve()
          })
          },























  //----------------------------------------create-rasorpay------------------------------------------------------//
createRazorpay:(orderid,grandTotal)=>{  
  console.log("+++++++++++++++++++++++++++++++++")
  console.log(grandTotal);
  console.log(orderid);   
  return new Promise((resolve,reject)=>{ 
    instance.orders.create({
      amount: grandTotal*100,
      currency: "INR",
      receipt: ""+orderid            
    },
    function(err,order){
      if(err){  
        console.log(err);
      }else{
        console.log("New order:",order);
        resolve(order)
      }
    })
  })
},
//-----------------------------------------verify-Payment----------------------------------------------------------//
verifyPayment:(details)=>{
  return new Promise((resolve,reject)=>{
    let crypto = require("crypto");
    let hmac = crypto.createHmac('sha256',  process.env.RAZORPAY_KEY)

    hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
    hmac=hmac.digest('hex')
    if(hmac==details['payment[razorpay_signature]']){
      console.log("000000000000");
      resolve()
    }else{ 
      console.log("5555555555555555");
      reject() 
    }
  })
},
//--------------------------------------------change-paymentStatus--------------------------------------------//
changePayementStatus:(orderid)=>{
  console.log(orderid+"+999999999999999999999999999")
  return new Promise(async(resolve,reject)=>{
    
    const changestatus=await orderModel.findOneAndUpdate({_id:orderid},
      {
       $set:{payment_status:'placed'}
      }
    ).then((changestatus)=>{
      resolve(changestatus)
    })
  }) 
},






addTowishlist: (proId, userId) => {
  return new Promise(async (resolve, reject) => {
    const userdt = await wishlistModel.findOne({ user_id: userId });
    if (userdt) {
      const proExist = userdt.products.findIndex(
        (products) => products.pro_Id == proId
      );
      if (proExist != -1) {
        resolve({ error: "product already in wishlist" });
      } else {
        await wishlistModel
          .findOneAndUpdate(
            { user_id: userId },
            { $push: { products: { pro_Id: proId } } }
          )
            resolve({ msg: "added", count: res.products.length + 1 });
      }
    } else {
      const newwishlist = new wishlistModel({
        user_id: userId,
        products: { pro_Id: proId },
      });
      await newwishlist.save((err, result) => {
        if (err) {
          resolve({ msg: "not added to wishlist" });
        } else {
          resolve({ msg: "wislist created" });
        }
      });
    }
  });
},



// --------------------------------------------------------------wishlist----------------------


getwishlist: (userId) => {
  return new Promise(async (resolve, reject) => {
    const wishlist = await wishlistModel
      .findOne({ user_Id: userId })
      .populate("products.pro_Id")
      .lean();
    resolve(wishlist);
  });
},



addTowishlist: (proId, userId) => {
  return new Promise(async (resolve, reject) => {
    const alreadyWish = await wishlistModel.findOne({ user_Id: userId });
    const product = await productData.findById({_id:proId});
    if (alreadyWish) {
      let proExist = alreadyWish.products.findIndex(
        (products) => products.pro_Id == proId);  
      if (proExist != -1) {
       wishlistModel.updateOne(
        {"products.pro_Id":proId,user_Id:userId},
       {
        $inc:{"products.$.quantity":1},
       })
       .then((response)=>{
        console.log("111111111111111111");
        resolve();
       })
      }else{
        await wishlistModel.findOneAndUpdate(
         {user_Id:userId},
          {$push:{products:{pro_Id:proId,MRP:product.MRP}}},
        )
        .then(async(res)=>{
          resolve({msg:'"Added",count:res.product.length+1'});
        });
      } 
    } else {
      const newwishlist = new wishlistModel({
        user_Id: userId,
        products: { pro_Id: proId,MRP:product.MRP},
      });
      await newwishlist.save((err, result) => {
        if (err) {
          resolve({ msg: "not added to wishlist" });
        } else {
          resolve({ msg: "wislist created",count:1 });
        }
      });
    }
  });
},


// ----------------------------getCartCount------------------------------------
getCartCount:(userId)=>{
  return new Promise(async(resolve,reject)=>{
    let Count= 0
    let user =await cart.findOne({user_Id : userId})
    if(user){
      Count = user.products.length
    }
    resolve(Count)
  })
},





// -------------------------validate coupon---------------------
validateCoupon: (data, userId) => {
  return new Promise(async (resolve, reject) => {
    console.log(data.coupon);
    obj = {};
    const coupon = await couponmodel.findOne({ couponCode: data.coupon });
    if (coupon) {
      if (coupon.limit > 0) {
        checkUserUsed = await couponmodel.findOne({
          couponCode: data.coupon,
          usedUsers: { $in: [userId] },
        });
        if (checkUserUsed) {
          obj.couponUsed = true;
          obj.msg = " You Already Used A Coupon";
          console.log(" You Already Used A Coupon");
          resolve(obj);
        } else {
          let nowDate = new Date();
          date = new Date(nowDate);
          if (date <= coupon.expirationTime) {
            await couponmodel.updateOne(
              { couponCode: data.coupon },
              { $push: { usedUsers: userId } }
            );
            await couponmodel.findOneAndUpdate(
              { couponCode: data.coupon },
              { $inc: { limit: -1 } }
            );
            let total = parseInt(data.total);
            let percentage = parseInt(coupon.discount);
            let discoAmount = ((total * percentage) / 100).toFixed();
            obj.discoAmountpercentage = percentage;
            obj.total = total - discoAmount;
            obj.success = true;
            resolve(obj);
          } else {
            obj.couponExpired = true;
            resolve(obj);
          }
        }
      } else {
        obj.couponMaxLimit = true;
        resolve(obj);
      }
    } else {
      obj.invalidCoupon = true;
      resolve(obj);
    }
  });
},






addAddress:(userId,data)=>{
  return new Promise(async(resolve,reject)=>{
    const user=userData.findOne({_id:userId})
    await userData.findOneAndUpdate(
      {_id:userId},
      {
        $push: { 
          address: {
            fname:data.fname,
            lname:data.lname,
            house:data.house,
            towncity:data.towncity,
            district:data.district,
            state:data.state,
            pincode:data.pincode, 
            email:data.email,
            mobile:data.mobile
          },
        },

      })   
      resolve();
   })

  },
  
deleteAddress:(addressId,user)=>{
return new Promise(async(resolve,reject)=>{
  const address=await userData.updateOne({_id:user._id},{$pull:{ address: { _id: addressId } }})
  resolve(address)
})
},

Editproflie:(data,userId)=>{
console.log(data);
console.log(userId);
return new Promise(async(resolve,reject)=>{
  const Editproflie=await userData.findByIdAndUpdate({_id:userId},{$set:{name:data.name,phonenumber:data.mobile}})
resolve(Editproflie)
})
},

getAddresses:(user)=>{
return new Promise(async(resolve,response)=>{
  const Addresses=await userData.findOne({_id:user}).lean()              
  // console.log(Addresses.address);
  resolve(Addresses)
})
}, 


deletewishlist: (proId, user) => {
  // console.log(user);
  console.log(proId,'eeeeeeeeeeeeeeeeeee');
  return new Promise(async (resolve, response) => {
    const remove = await wishlistModel.updateOne(
      { user_Id: user },
      { $pull: { products: { pro_Id: proId.cart } } }
    );
    resolve({ msg: "comfirm delete" });
  });
},












 



}