// 要做關聯就需要ObjectId
import { Schema, model, ObjectId } from 'mongoose'

const cartSchema = new Schema({
  p_id: {
    type: ObjectId,
    ref: 'products',
    required: [true, '使用者購物車商品必填']
  },
  quantity: {
    type: Number,
    required: [true, '使用者購物車商品數量必填'],
    min: [1, '使用者購物車商品數量不符']
  }
})

// 主體-----------------------------------------
const schema = new Schema({
  user: {
    type: ObjectId,
    ref: 'users',
    required: [true, '訂單使用者必填-models order.js']
  },
  cart: {
    type: [cartSchema],
    validate: {
      validator (value) {
        return value.length > 0
      },
      message: '訂單購物車必填-models order.js'
    }
  }
}, {
  versionKey: false,
  timestamps: true
})

export default model('orders', schema)
