const mongoose = require("mongoose");
const orderSchema = new mongoose.Schema({
  user_Id: { type: mongoose.Schema.Types.ObjectId, ref: "user" },
  paymentMethod: { type: String },
  product: [
    {
      pro_Id: { type: mongoose.Schema.Types.ObjectId, ref: "product" },
      price: { type: Number },
      quantity: { type: Number, default: 1 },
      subTotal: { type: Number, default: 0 },
      status:{type:String,default:'Order placed'},
      productName:{type:String},
      orderCancelled:{type:Boolean,default:false}
    },
  ],
  deliveryDetails:
    {
      name: String,
      number: String,
      email: String,
      house: String,
      localplace: String,
      town: String,
      district: String,
      state: String,
      pincode: Number,
    }
,
  Total:{type:Number}, 
  ShippingCharge:{type:Number},
  grandTotal: { type: Number, default: 0 },
  mainTotal:{type:Number},
  ordered_on: { type: Date },
  discountedPrice:{type:Number},
  payment_status: { type: String },
});
const orderModel = mongoose.model("order", orderSchema);
module.exports = orderModel;
