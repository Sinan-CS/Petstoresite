const productData = require("../models/productData");
const brands = require("../models/brand");
const adminData=require("../models/adminData");
const categories = require("../models/category");
const subcategories = require("../models/subCategory");
const productDatas = require("../models/productData");
const userData = require("../models/user");
const wishlistModel=require("../models/wishlist")
const db=require("../config/connections");
const bcrypt=require('bcrypt');
const nodeMailer=require('nodemailer');
const couponmodel=require("../models/Coupon");
const orderModel=require('../models/order')


module.exports = {

  doLogin: (adminData1) => {
    console.log(adminData1);
    return new Promise(async (resolve, reject) => {
      let loginStatus = false;
      let response = {};
      let admin = await adminData.findOne({ email: adminData1.email });
      // let admin= await adminData.findOne({email:userDataaa.email})
      // console.log(userData);
      // console.log(user.email);

      if (admin) {
        
        console.log(admin);
        
        console.log(adminData1.password);
        console.log(admin.Password);
        bcrypt.compare(adminData1.password, admin.Password).then((status) => {
          if (status) {
            console.log("Login Success!");
            response.admin =admin;
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







    //-------------------------Add-category---------------------------------------------------------//
    addCategory:(categoryData) => {
        return new Promise(async (resolve, reject) => {
          const categoryName = categoryData.Category;
          console.log(categoryName);
    
          const categoryexist = await categories.findOne({
            Category: categoryName,
          });
          if (categoryexist) {
            reject({ status: false, msg: "Entered Category already exists!" });
          } else {
            const addCategories = await new categories({
              Category: categoryName,
            });
            await addCategories.save(async (err, result) => {
              if (err) {
                reject({ msg: "Category can't be added" });
              } else {
                resolve({ result, msg: "New Category Added" });
              }
            });
          }
        });
      },
      //------------------getCategories----------------------------------------------------------------------//
      getCategories: () => {
        return new Promise(async (resolve, reject) => {
          const allCategory = await categories.find({}).lean();
          resolve(allCategory);
        });
      },
      //------------------------------Add-Subcategories------------------------------------------------------//
      addSubcategory: (subcategoryData) => {
        return new Promise(async (resolve, reject) => {
          const subcategoryName = subcategoryData.Sub_category;
          console.log(subcategoryData);
    
          const subcategoryFind = await subcategories.findOne({
            Sub_category: subcategoryName,
          });
          const categoryFind = await categories.findOne({
            Category: subcategoryData.Category,
          });
          if (subcategoryFind) {
            reject({ status: false, msg: "Entered Subcategory already exist" });
          } else {
            const addSubcategories = await new subcategories({
              Sub_category: subcategoryName,
              Category: categoryFind._id,
            });
    
            await addSubcategories.save(async (err, result) => {
              if (err) {
                reject({ msg: "Subcategory can't be added" });
              } else {
                resolve({ result, msg: "New Subcategory Added" });
              }
            });
          }
        });
      },
      //-------------------------------get-subcategories--------------------------------------------------------//
      getSubcategories: () => {
        return new Promise(async (resolve, reject) => {
          const allSubcategory = await subcategories.find({}).lean();
          resolve(allSubcategory);
        });
      },
      //--------------------------------Add-Brands----------------------------------------------------------------//
      addBrandName: (brandData) => {
        return new Promise(async (resolve, reject) => {
          const brandNames = brandData.Brand_Name;
          //console.log(brandNames);
    
          const brandexist = await brands.findOne({ Brand_Name: brandNames });
          if (brandexist) {
            reject({ status: false, msg: "This Brand already exists!" });
          } else {
            const addBrand = await new brands({
              Brand_Name: brandNames,
            });
            await addBrand.save(async (err, result) => {
              if (err) {
                reject({ msg: "Brand can't be added" });
              } else {
                resolve({ result, msg: "New Brand added" });
              }
            });
          }
        });
      },
      getBrands: () => {
        return new Promise(async (resolve, reject) => {
          const brandsData = await brands.find({}).lean();
          resolve(brandsData);
        });
      },
    
    //-----------------------------------------------Add-product--------------------------------------------//
    addProduct: (data, image1, image2, image3, image4) => {
      return new Promise(async (resolve, reject) => {
        const subcategoryData = await subcategories.findOne({
          Sub_category: data.Subcategory,
        });
        const brandData = await brands.findOne({ Brand_Name: data.brand });
        const categoryData = await categories.findOne({
          Category: data.Category,
        });
  
        console.log("Subcategory: " + subcategoryData);
        console.log("Brand: " + brandData);
        console.log("Category: " + categoryData);
  
        if (!image2) {
          reject({ msg: "Upload Image" });
        } else {
          const newProduct = await productData({
            Product_Name: data.Product_Name,
            Description: data.Description,
            MRP: data.MRP,
            Discount: data.Discount,
            Size: data.Size,
            Stock: data.Stock,
            Color: data.Color,
            Category: categoryData._id,
            Sub_category: subcategoryData._id,
            Brand: brandData._id,
            Images: { image1, image2, image3, image4 },
          });
          await newProduct.save(async (err, result) => {
            if (err) {
              reject({ msg: "Product can't be added" });
            } else {
              resolve({ data: result, msg: "Product Added Successfully" });
            }
          });
        }
      });
    },
  
  //------------------------------get-product-----------------------------------------------------------------//
    getProducts: () => {
      return new Promise(async (resolve, reject) => {
        const allProducts = await productData.find({}).populate('Category').populate('Sub_category').lean()
        resolve(allProducts);
      });
    },
  
    getoneProduct: (data) => {
      return new Promise(async (resolve, reject) => {
        const theProduct = await productData.findOne({_id:data}).lean();
        resolve(theProduct);
      });
    },
    

  //------------------------------Edit-products-------------------------------------------------------------------//

  editProducts: (data, proId, image1, image2, image3, image4) => {
    return new Promise(async (resolve, reject) => {
      console.log("jglskdj");
      const subcategoryData = await subcategories.findOne({
        _id: data.Sub_category
      });
      const brandData = await brands.findOne({ _id: data.Brand });
      const categoryData = await categories.findOne({
        _id: data.Category
      });
      console.log(categoryData);
      const updateProduct = await productData.findByIdAndUpdate(
        { _id: proId },
        {
          $set: {
            Product_Name: data.Product_Name,
            Description: data.Description,
            MRP: data.MRP,
            Discount: data.Discount,
            Size: data.Size,
            Stock: data.Stock,
            Color: data.Color,
            Category: categoryData._id,
            Sub_category: subcategoryData._id,
            Brand: brandData._id,
            Images: { image1, image2, image3, image4 },
          },
        }
      ); resolve({updateProduct, msg:"The Product is Edited"})
    });
  },
  deleteProduct: (proId) => {
    console.log("log2: " + proId);
    return new Promise(async (resolve, reject) => {
      let productId = proId;
      const removedProduct = await productData.findByIdAndDelete({
        _id: productId,
      });
      resolve(removedProduct);
    });
  },    
  //------------------------------user-management-----------------------------------------------------------------//
getAllUsers: () => {
  return new Promise(async (resolve, reject) => {
    let users = await userData.find().lean();
    resolve(users);
  });
},

Blockuser: (userId) => {
    console.log(userId);
    return new Promise(async (resolve, reject) => {
      const user = await userData.findByIdAndUpdate(
        { _id: userId },
        { $set: { block: true } },
        { upsert: true }
      );
      resolve(user);
    });
  },

  UnBlockuser: (userId) => {
    return new Promise(async (resolve, reject) => {
      const user = await userData.findByIdAndUpdate(
        { _id: userId },
        { $set: { block: false } },
        { upsert: true }
      );
      resolve(user);
    });
  },
  //---------------------------------------//
  // getAllProducts:()=>{
  //   console.log('in get all products');
  //   return new Promise(async(resolve,reject)=>{
  //     console.log('inside rs');
  //     const allProducts= await productData.find({}).lean();
  //     resolve(allProducts)
  //   })
  // },

//-------------------------------------------product-Details------------------------------------------//
getProductDetails:(proId)=>{
  return new Promise(async(resolve,reject)=>{
    const productDetails = await productData.findOne({_id:proId}).lean().then((productDetails)=>{
      resolve(productDetails)
      console.log(productDetails);
    })
  })
  },
  //-------------------------------------------order management---------------------------------------------------------------//
  allorders: () => {
    return new Promise(async (resolve, reject) => {
        const allorders = await orderModel.find({}).populate("product.pro_Id").sort({ _id:1}).lean()
        resolve(allorders)
    })
},


// -------------------------------chasrt-------------------------------
salesReport: (data) => {
  let response = {};
  let { startDate, endDate } = data;
  let d1, d2, text;
  if (!startDate || !endDate) {
    d1 = new Date();
    d1.setDate(d1.getDate() - 7);
    d2 = new Date();
    text = "For the Last 7 days";
  } else {
    d1 = new Date(startDate);
    d2 = new Date(endDate);
    text = `Between ${startDate} and ${endDate}`;
  }
  const date = new Date(Date.now());
  const month = date.toLocaleString("default", { month: "long" });
  return new Promise(async (resolve, reject) => {
    let salesReport = await orderModel.aggregate([
      {
        $match: {
          ordered_on: {
            $lt: d2,
            $gte: d1,
          },
        },
      },
      {
        $match: { payment_status: "placed" },
      },
      {
        $group: {
          _id: { $dayOfMonth: "$ordered_on" },
          total: { $sum: "$grandTotal" },
        },
      },
    ]);
    let brandReport = await orderModel.aggregate([
      {
        $match: { payment_status: "placed" },
      },
      {
        $unwind: "$product",
      },
      {
        $project: {
          brand: "$product.productName",
          quantity: "$product.quantity",
        },
      },

      {
        $group: {
          _id: "$brand",
          totalAmount: { $sum: "$quantity" },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
    ]);
    // let orderCount = await ordermodel
    //   .find({ date: { $gt: d1, $lt: d2 } })
    //   .count();
    // let totalAmounts = await orderModel.aggregate([
    //   {
    //     $match: { payment_status: "placed" },
    //   },
    //   {
    //     $group: {
    //       _id: null,
    //       totalAmount: { $sum: "$grandTotal" },
    //     },
    //   },
    // ]);
    // let totalAmountRefund = await orderModel.aggregate([
    //   {
    //     $match: { status: "Order placed" },
    //   },
    //   {
    //     $group: {
    //       _id: null,
    //       totalAmount: { $sum: "$reFund" },
    //     },
    //   },
    // ]);
    response.salesReport = salesReport;
    response.brandReport = brandReport;
    // response.orderCount = orderCount;
    // response.totalAmountPaid = totalAmounts.totalAmount;
    // response.totalAmountRefund = totalAmountRefund.totalAmount;
    resolve(response);
  });
},





















//-----------------------------------------------------------------------------------------------//
AddCoupon:(data)=>{ 
  console.log(data);
  return new Promise(async(resolve,reject)=>{
    const newCoupon=new couponmodel({
      couponName:data.couponName,
      couponCode:data.CoupoCode,
      limit:data.Limit,
      expirationTime:data.ExpireDate,
      discount:data.discount
    })
    await newCoupon.save();
    resolve()
  })
},

//-----------------------------------------------------------------------------------------------------/

getAllCoupons:()=>{
  console.log("kasjfkjk");
  return new Promise (async(resolve,reject)=>{
    const AllCoupons=await couponmodel.find({}).lean()
    resolve(AllCoupons)
  })
},
deletecoupon:(couponId)=>{
  return new Promise(async(resolve,reject)=>{
    console.log(couponId);
    const deletecoupon=await couponmodel.findByIdAndDelete({_id:couponId})
    resolve(deletecoupon)
  })
    },
  
}
