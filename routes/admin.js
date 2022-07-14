var express = require("express");
var router = express.Router();
const category = require("../models/category");
const productHelpers = require("../helpers/product-helpers");
const Storage = require("../Middleware/multer");
const moment=require('moment')


/* GET users listing. */
// router.get("/", function (req, res, next) {
//   res.render("admin/admin-home", { layout: "adminLayout" });
// });

//  router.get('/', function (req, res) {
//    res.header('Cache-control', 'no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0,pre-check=0')
//   if (req.session.adminloggedIn) {
//     res.redirect('/admin/admin')
//   } else {
//     res.render('admin/adminLogin',{layout:false} );
//     req.session.loginErr = false
//   }
// });

// router.get("/addcategory",function(req, res, next){
//     res.render("admin/addcategory",{layout:'adminLayout'})
// })
// router.get("/", function (req, res) {
//   res.header(
//     "Cache-control",
//     "no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0,pre-check=0"
//   );
//   if (req.session.adminLoggedIn) {
//     res.redirect("/admin/admin-home", { admin: true });
//   } else {
//     res.render("admin/admin-login", {
//       layout: false,
//       adminLoginErr: req.session.adminLoginErr,
//     });
//   }
// });


router.get("/",(req,res)=>{
  res.render("admin/admin-login",
  {
    layout:false
  })

})

router.post("/data", (req, res, next) => {
  // res.header(
  //   "Cache-control",
  //   "no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0,pre-check=0"
  // );

  console.log(req.body);
  productHelpers.doLogin(req.body).then((response) => {
      console.log("inside doLogin");
      if (response.admin) {
          req.session.adminLogged = true;
          req.session.admin = response.admin;
          res.redirect("/admin/admin-home")
      }// else {
      //    res.redirect("/login")
      // }
  })
      .catch((err) => {
          req.session.loggedInError = err.msg;
          res.redirect("/admin");

      });
});

router.get("/logout", (req, res, next) => {
  // req.session.adminLogged = false;
  req.session.destroy(()=>{
      res.redirect("/admin")
  })
  

});



// ---------------------------------------chart-------------------------
router.post("/getData", async (req, res) => {
  const date = new Date(Date.now());
  const month = date.toLocaleString("default", { month: "long" });
  productHelpers.salesReport(req.body).then((data) => {
    // let pendingAmount = data.pendingAmount;
    let salesReport = data.salesReport;
    let brandReport = data.brandReport;
    // let orderCount = data.orderCount;
    // let totalAmountPaid = data.totalAmountPaid;
    // let totalAmountRefund = data.totalAmountRefund;
     console.log(month._id)
    let dateArray = [];
    let totalArray = [];
    salesReport.forEach((s) => {
      dateArray.push(`${month}-${s._id} `);
      totalArray.push(s.total);
    });
    console.log(salesReport)
    let brandArray = [];
    let sumArray = [];
    brandReport.forEach((s) => {
      brandArray.push(s._id);
      sumArray.push(s.totalAmount);
    });
    res.json({
      // totalAmountRefund,
      dateArray,
      totalArray,
      brandArray,
      sumArray,
      // orderCount,
      // totalAmountPaid,
      // pendingAmount,
    });
  });
});














router.get("/admin-home", (req, res) => {
  res.header(
    "Cache-control",
    "no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0,pre-check=0"
  );
  req.session.adminLoggedIn;
  res.render("admin/admin-home", {
    adminDetails: true,
    layout: "adminLayout",
  });
});
//--------------------------------add-category-------------------------------------------//
router.get("/add-category", (req, res) => {
  productHelpers.getCategories().then((allCategory) => {
    res.render("admin/products/add-category", {
      allCategory,
      err1: req.session.categoryExistErr,
      err2: req.session.subcategoryExitsErr,
      adminDetails: true,
      layout: "adminLayout",
    });
    req.session.categoryExistErr = null;
    req.session.subcategoryExitsErr = null;
  });
});
router.post("/add-category", (req, res) => {
  productHelpers
    .addCategory(req.body)
    .then((response) => {
      console.log(response);
      res.redirect("/admin/add-category");
    })
    .catch((err) => {
      req.session.categoryExistErr = err.msg;
      res.redirect("/admin/add-category");
      console.log(err);
    });
});
//---------------------------Add-subcategory--------------------------------------------------//
router.post("/add-subcategory", (req, res) => {
  productHelpers
    .addSubcategory(req.body)
    .then((response) => {
      console.log(response);
      res.redirect("/admin/add-category");
    })
    .catch((err) => {
      req.session.subcategoryExitsErr = err.msg;
      res.redirect("/admin/add-category");
      console.log(err);
    });
});
//----------------------------------Brand-name--------------------------------------------//

router.get("/add-brands", (req, res) => {
  res.render("admin/products/add-brands", {
    err: req.session.brandExistErr,
    adminDetails: true,
    layout: "adminLayout",
  });
  req.session.brandExistErr=null
});

router.post("/add-brands", (req, res) => {
  productHelpers
    .addBrandName(req.body)
    .then((response) => {
      console.log("Welcome: ");
      console.log(response);
      res.redirect("/admin/admin-products");
    })
    .catch((err) => {
      req.session.brandExistErr = err.msg;
      res.redirect("/admin/add-brands");
      console.log(err);
    });
});
//-----------------------------------------Add-product----------------------------------------------//

router.get("/add-product", async (req, res) => {
  const category = await productHelpers.getCategories();
  const brand = await productHelpers.getBrands();
  const subcategory = await productHelpers.getSubcategories();
  console.log(category + "\n" + brand + "\n" + subcategory);

  res.render("admin/products/add-product", {
    category,
    brand,
    subcategory,
    adminDetails: true,
    layout: "adminLayout",
  });
});
router.post(
  "/add-product",
  Storage.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  (req, res) => {
    console.log(req.body);
    console.log(req.files);

    const img1 = req.files.image1[0].filename;
    const img2 = req.files.image1[0].filename;
    const img3 = req.files.image1[0].filename;
    const img4 = req.files.image1[0].filename;
    console.log(img1, img2, img3, img4);

    productHelpers
      .addProduct(req.body, img1, img2, img3, img4)
      .then((response) => {
        console.log(response);
       // req.flash("msg", "Product Added Successfully");
        res.redirect("/admin/add-product");
      });
  }
);







//----------------------------------View-product----------------------------------------------//

router.get("/admin-products", async (req, res) => {
  const products = await productHelpers.getProducts();
  const brands = await productHelpers.getBrands();
  const categories = await productHelpers.getCategories();
  const subcategories = await productHelpers.getSubcategories();
  console.log(products);
  // const alert = req.flash("msg");
  res.render("admin/products/add-products", {
    brands,
    subcategories,
    categories,
    products,
    adminDetails: true,
    layout: "adminLayout",
  });
});

//-----------------------------------Edit-product-------------------------------------------------//

router.get("/edit-products/:id", async (req, res) => {
  const product = await productHelpers.getoneProduct(req.params.id);
  console.log("-------------------------------------------------------------");
  console.log(product._id);
  const brands = await productHelpers.getBrands();
  const categories = await productHelpers.getCategories();
  const subcategories = await productHelpers.getSubcategories();
  res.render("admin/products/edit-products", {
    adminDetails: true,
    layout: "adminLayout",
    product,
    brands,
    categories,
    subcategories,
  });
});

router.post(
  "/edit-products/:id",
  Storage.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  (req,res)=>{
    const proId = req.params.id
    const img1 = req.files.image1?req.files.image1[0].filename:req.body.image1;
    const img2 = req.files.image2?req.files.image2[0].filename:req.body.image2;
    const img3 = req.files.image3?req.files.image3[0].filename:req.body.image3;
    const img4 = req.files.image4?req.files.image4[0].filename:req.body.image4;

    console.log(img1,img2,img3,img4);
    productHelpers.editProducts(req.body,proId,img1,img2,img3,img4).then((response)=>{
      console.log("Response: "+response);
     // req.flash("msg",response.updateProduct.Product_Name,response.msg)
      res.redirect('/admin/add-products')
    })
  }
);

//-----------------------------Delete-product-------------------------------------------------//

router.get("/deleteProduct/:id", (req, res) => {
  const proId = req.params.id;
  console.log("log1: " + proId);
  productHelpers.deleteProduct(proId).then((response) => {
    req.session.removedProduct = response;
    //req.flash("msg", "Product Deleted..!");
    res.redirect("/admin/products/add-products");
  });
  console.log(proId);
});

// ------------------------------------------------------------------------------------------

router.get('/ordermanagement',(req, res) => {
  productHelpers.allorders().then((response) => {
    console.log(response);
    const allorders = response;
    allorders.forEach(element => {
      element.ordered_on = moment(element.ordered_on).format("MMM Do YY");
        });
  
    res.render('admin/users/order-management', { layout: "adminLayout",allorders })
  })
})



// ------------------------------------------add coupon------------------------

router.get("/coupon-manegement", (req, res) => {
  productHelpers.getAllCoupons(req.body).then((response) => {
    const AllCoupons = response;
    res.render("admin/coupon-manegement", { AllCoupons, layout: false });
  });
});

router.get("/deletecoupon/:id", (req, res) => {
  productHelpers.deletecoupon(req.params.id).then((response) => {
    res.json({ coupondeleted: true });
  });
});

router.get("/addcoupon", (req, res) => {
  res.render("admin/addcoupon", { layout: false });
});

router.post("/AddCoupon", (req, res) => {
  productHelpers.AddCoupon(req.body).then(() => {
    res.redirect("/admin/coupon-manegement");
  });
});










//-----------------------------------Block/unblock-user-----------------------------------------------//

router.get('/manage-user', function (req, res, next) {
  res.header('Cache-control', 'no-cache,private, no-store, must-revalidate,max-stale=0,post-check=0,pre-check=0');
    productHelpers.getAllUsers().then((userData) => {
      console.log(userData);
      res.render("admin/users/manage-user", { userData, layout:"adminLayout"});
    });


});
router.get("/Blockuser/:id", (req, res) => {
  const proId = req.params.id; 
  console.log(proId);
  console.log("sdjfhusguasuashguahshasdgs");
  productHelpers.Blockuser(proId).then((response) => {
    res.json({status:true})

  });
});
router.get("/UnBlockuser/:id", (req, res) => {
  const proId = req.params.id;
  console.log("esfhusayfuahiuashahsfhasdu");
  productHelpers.UnBlockuser(proId).then((response) => {
    res.json({status:true})
  });
});
module.exports = router;
