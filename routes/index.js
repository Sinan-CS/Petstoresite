var express = require('express');
const async = require('hbs/lib/async');
const { response } = require('../app');
var router = express.Router();
const userHelpers = require("../helpers/userHelpers");
const productHelpers = require("../helpers/product-helpers");
const user = require("../models/user");
const product = require("../models/productData");
const cart = require("../models/cart");
const moment=require('moment');
const wishlist = require('../models/wishlist');


const verifyLogin=(req,res,next)=>{
  if(req.session.user){
    next()
  }else{
    res.redirect('/login')
  }
}




/* GET home page. */
router.get('/', async function (req, res, next) {
  let user = req.session.user;
  const products = await productHelpers.getProducts();
  let CartCount =null
  if(user){
    CartCount = await userHelpers.getCartCount(user)
  }
  res.render('user/index', {CartCount,user,products});
});

router.get('/login', function (req, res, next) {
  if (req.session.logedin) {
    res.redirect("/");
  } 
   res.render("user/login", {
    signupSuccess: req.session.signupSuccess,
    loggErr: req.session.loggedInError,
    signuperror: req.session.loggErr2,
    passwordreset: req.session.message,
    title: "userLogin",
    layout: false

  });
  req.session.signupSuccess = null;
  req.session.loggErr2 = null;
  req.session.loggedInError = null;
  req.session.message = null;


});

router.get('/signup', function (req, res, next) {
  let user = req.session.user;
  res.render("user/signup", { layout: false });
});


router.post("/usignUp", function (req, res, next) {
  userHelpers.doSignup(req.body).then((response) => {
    console.log(response);
    req.session.otp = response.otp;
    req.session.userdetails = response;
    res.redirect("/otp");
  })
    .catch((err) => {
      req.session.loggErr2 = err.msg;
      res.redirect("/login");
    });

});

router.get("/otp", function (req, res, next) {
  res.render('user/user_otp', { layout: false, otpErr: req.session.otpError });
});

router.post("/otp_verify", async (req, res) => {
  if (req.session.otp == req.body.otpsignup) {
    let userData = req.session.userdetails;
    const adduser = await new user({
      name: userData.name,
      phone: userData.phone,
      email: userData.email,
      password: userData.password,
    });
    await adduser.save();
    req.session.signupSuccess = "signup sucessful! please login to continue";
    res.redirect("/login");
  } else {
    console.log("otp incorrect");
    req.session.otpError = "OTP not matching";
    res.redirect("/otp");

  }
});

router.post("/userlogin", (req, res, next) => {
  // res.header(
  //   "Cache-control",
  //   "no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0,pre-check=0"
  // );
  
  console.log(req.body);
  userHelpers.doLogin(req.body).then((response) => {
    console.log("inside doLogin");
    if (response.user) {
      req.session.logedin = true;
      req.session.user = response.user;
      res.redirect("/")
     }// else {
    //    res.redirect("/login")
    // }
  })
    .catch((err) => {
      req.session.loggedInError = err.msg;
      res.redirect("/login");
    });
});

router.get("/logout",function(req,res,next){
  res.redirect("/login");
  req.session.destroy();
});

router.get("/forgetPassword",function(req,res,next){
  res.render("user/forgetPassword",{layout:false});
});

router.post("/forget", async (req, res) => {
  userHelpers
    .doresetPasswordOtp(req.body)
    .then((response) => {
      console.log(response);
      req.session.otp = response.otp;
      req.session.userdetails = response;
      req.session.userRID = response._id;
      // console.log(req.session.userRID+'hhhhh');
      res.redirect("/otpReset");
    })
    .catch((err) => {
      req.session.loggErr2 = err.msg;
      res.redirect("/login");
    });
});

router.get("/otpReset", function (req, res, next) {
  res.render("user/otpReset", { layout: false, otpErr: req.session.otpError });
});

router.post("/otpResetVerify", async (req, res) => {
  if (req.session.otp == req.body.otpsignup) {
    res.redirect("/newPassword");
  } else {
    console.log("otp incorrect");
    req.session.otpError = "OTP not matching!";
    res.redirect("/otpReset");
  }
});
router.get("/newPassword", function (req, res, next) {
  res.render("user/newPassword", {
    layout: false,
    otpErr: req.session.otpError,
    passErr: req.session.passErr,
  });
  req.session.passErr = null;
  req.session.otpError = null;
});

router.post("/RPass", async (req, res) => {
  console.log(req.body);
  if (req.body.password == req.body.confirmPassword) {
    userHelpers.doresetPass(req.body, req.session.userRID).then((response) => {
      console.log(response);
      req.session.message =
        "Password changed succesfully! Please login with new password";
      res.redirect("/login");
      console.log("Password updated");
    });
  } else {
    console.log("password mismatch");
    req.session.passErr = "Password mismatch";
    res.redirect("/newPassword");
  }
});

// router.get('/productDetails', function (req, res, next) {

router.get("/productDetails/:id",async(req,res) => {

  let product = await userHelpers.getSingleProduct(req.params.id)
     res.render("user/productDetails", { product, user:req.session.user });

 });












//  -------------------------------------------------ADD TO CART----------------------------------------------------------------
router.get("/add-tocart/:id",verifyLogin, (req, res) => {
  console.log('000000000000000000000000000000000000000000000')
  userHelpers
    .addToCart(req.params.id, req.session.user._id)
    .then((response) => {
      console.log("req.session.user._id");
      res.json({ status: true });
      //   res.redirect("/");
      // });
    })
    .catch((error) => {
      console.log("33333333333333333333333");
      console.log(error.msg);
      res.redirect("/productDetails");
    });
});

  

router.get("/cartNew", verifyLogin, async function (req, res, next) {
  let user = req.session.user;
   let cartCount =await userHelpers.getCartCount(req.session.user._id);
  if (cartCount > 0) {
    console.log(" cart count");
    const subTotal = await userHelpers.subTotal(req.session.user._id);
    const totalAmount = await userHelpers.totalAmount(req.session.user._id);
    console.log(totalAmount);
    const netTotal = totalAmount.grandTotal.total;
    console.log("nettotal",netTotal);
    const deliveryCharge = await userHelpers.deliveryCharge(netTotal);
    const grandTotal = await userHelpers.grandTotal(netTotal, deliveryCharge);
    const cartItems = await userHelpers.getCartItems(req.session.user._id);
    console.log("cart 5555");
    console.log("cart get222222222222222222222");
    
    console.log("1",deliveryCharge);
    res.render("user/cartNew", {
      cartCount,
      user,
      cartItems,
      subTotal,
      netTotal,
      deliveryCharge,
      grandTotal,
    });
  } else {
    let cartItem = await userHelpers.getCartItems(req.session.user);
    let cartItems = cartItem ? product : [];
    cartItem=0
    netTotal = 0;
    cartCount = 0;
    deliveryCharge = 0;
    grandTotal = 0;
    res.render("user/emptycart", {
      
      cartItems,
      netTotal,
      cartCount,
      deliveryCharge,
      grandTotal,
      user,
    });
  }
});

  // router.get('/cartNew'), function(req,res,next){
  //   res.render('user/cartNew')
  // }


  //  ---------------------------------change product quantity------------------------------------------------------------   

router.post("/change-product-quantity", (req, res) => {
 userHelpers.changeProductQuantity(req.body, req.session.user).then();
 res.json({ status: true });

});


// -----------------------------------wishlist-----------------------------------------------------------------

router.get("/wishlist", async (req, res) => {
  console.log("wishlists")
  let user = req.session.user;
  const cartItems = await userHelpers.getCartItems(req.session.user);
  let wishlist = await userHelpers.getwishlist(req.session.user);
  console.log("hello bvoss")
  if (wishlist) res.render("user/wishlist", { wishlist,user,cartItems });
});

 
// -------------------------------------------------------------------------------------------------------------
 




router.get("/add-towishlist/:id",verifyLogin, (req, res) => {
  console.log('000000000000000000000000000000000000000000000')
  userHelpers
    .addTowishlist(req.params.id, req.session.user._id)
    .then((response) => {
      console.log("req.session.user._id");
      res.json({ status: true });
      //   res.redirect("/");
      // });
    })
    .catch((error) => {
      console.log("33333333333333333333333");
      console.log(error.msg);
      res.redirect("/productDetails");
    });
});

// -------------------------------remove products-------------------------------------------------------------------

router.post("/removeProductFromCart", (req, res, next) => {
  userHelpers.removeProductFromCart(req.body, req.session.user).then(() => {
    res.json({ status: true });
  });
});



router.get("/checkout", async (req, res) => {
  let user = req.session.user._id;
  const cartItems = await userHelpers.getCartItems(req.session.user._id);
  const subTotal = await userHelpers.subTotal(req.session.user._id);
  const totalAmount = await userHelpers.totalAmount(req.session.user._id)

  const netTotal = totalAmount.grandTotal.total;
  const Addresses = await userHelpers.getAddresses(req.session.user);
  const deliveryCharge = await userHelpers.deliveryCharge(netTotal);
  const grandTotal = await userHelpers.grandTotal(netTotal, deliveryCharge);
  const AllCoupons = await productHelpers.getAllCoupons()
  res.render("user/checkout", {
    netTotal,
    deliveryCharge,
    grandTotal,
    AllCoupons,
    Addresses, 
    subTotal,
    user,
    cartItems,
     

     
    
  });
});



router.post("/placeOrder", async (req, res) => {
  const cartItem = await userHelpers.getCartItems(req.session.user._id);
  const totalAmount = await userHelpers.totalAmount(req.session.user._id);
  const netTotal = totalAmount.grandTotal.total;
  const deliveryCharge = await userHelpers.deliveryCharge(netTotal);
  const grandTotal = await userHelpers.grandTotal(netTotal, deliveryCharge);
  userHelpers.placeOrder(
      req.body,
      cartItem,
      grandTotal,
      deliveryCharge, 
      netTotal,
      req.session.user
    )
    .then((response) => {
      req.session.orderId = response._id;
      const orderId = response._id;
      console.log(orderId);
      if (req.body["paymentMethod"] === "cod") {
        console.log("++");
        res.json({ codSuccess: true });
      } else {
        userHelpers.createRazorpay(orderId, grandTotal).then((response) => {
          res.json(response);
        }); 
      }
    });  
});  


router.post("/verifyPayment", (req, res) => {
   console.log('indside verify')
  userHelpers
    .verifyPayment(req.body)
    .then(() => {
      userHelpers
        .changePayementStatus(req.body["order[receipt]"])
        .then((response) => {
          res.json({ status: true });
        });   

         
    })
    .catch((err) => {
      res.json({ status: false });
    });
});
  
 



   





router.get("/viewOrderDetails", async (req, res) => {
  let user = req.session.user;
  userHelpers.getorderProducts(req.session.orderId).then((response) => {
    const orderProducts = response;
    const ordered_on=moment(orderProducts.ordered_on).format('MMMM Do YYYY, h:mm:ss a');  
      console.log(ordered_on,'sinan');
    res.render("user/orderSuccess", { ordered_on,user, orderProducts});
  });
});




router.get('/viewOrderProducts/:id',(req,res)=>{
  console.log(req.params.id);
  userHelpers.getorderProducts(req.params.id).then((response) => {
    console.log(response.product.status);
    const order=response
    
    if(order.product[0].status=='Cancelled'){
      order.product[0].cancelled=true
    }
    console.log(order);
    res.render('user/orderTracking',{order})
  })
  })















//-----------------------------------------User-Profile-----------------------------------------------------//

router.get('/myprofile',  async (req, res)=> {
  const user = await userHelpers.userprofile(req.session.user);
  res.render('user/profile/myprofile',{user});
});

//-----------------------------------------Edit-Profile-----------------------------------------------------//

router.get('/edit-profile',  function (req, res, next) {
  
  res.render('user/profile/edit-profile',{user:req.session.user});
});
//----------------------------------------Address-page------------------------------------------------------//
router.get('/address-page',async (req, res, next)=>{
  const Addresses = await userHelpers.getAddresses(req.session.user);
  let user = req.session.user;
  res.render('user/profile/address',{Addresses,user});
});

router.post("/addAddress/:id", (req, res) => {
  userHelpers.addAddress(req.params.id, req.body).then((response) => {
    res.redirect("/address-page");
  });
});
//--------------------------------------Add-address-----------------------------------------------------------//

router.get("/addAddress", async(req, res) => {
  let user = req.session.user;
  res.render("user/profile/addAddress", { user });
});

router.get("/editAddress/:id", (req, res) => {
  let user = req.session.user;
  res.render("user/profile/editaddress",{user});
});

router.get("/deleteAddress/:id", (req, res) => {
  userHelpers.deleteAddress(req.params.id, req.session.user).then((response) => {
    res.redirect("/address-page");
  });
});





router.post("/Editproflie", (req, res) => {

  userHelpers.Editproflie(req.body, req.session.user._id).then(() => {
    res.redirect("/myprofile");
  });
});

//-----------------------------------------User-Profile-----------------------------------------------------//

router.get('/myprofile',  async (req, res)=> {
  const user = await userHelpers.userprofile(req.session.user);
  res.render('user/profile/myprofile',{user});
});

//-----------------------------------------Edit-Profile-----------------------------------------------------//

router.get('/edit-profile',  function (req, res, next) {
  
  res.render('user/profile/edit-profile',{user:req.session.user});
});
//----------------------------------------Address-page------------------------------------------------------//
router.get('/address-page',async (req, res, next)=>{
  const Addresses = await userHelpers.getAddresses(req.session.user);
  let user = req.session.user;
  res.render('user/profile/address',{Addresses,user});
});

router.post("/addAddress/:id", (req, res) => {
  userHelpers.addAddress(req.params.id, req.body).then((response) => {
    res.redirect("/address-page");
  });
});



// --------------------------------removewishlist-----------------------------
router.post("/deletewishlist", async (req, res) => {
  userHelpers.deletewishlist(req.body, req.session.user)
    .then((response) => {
      res.json({ status: true }); 
    });
});

























router.get("/model",(req, res) => {
 
  res.render("user/model");
});




































module.exports = router;
