import { Schema, model, ObjectId, Error } from 'mongoose'
import validator from 'validator'
import bcrypt from 'bcrypt'
import UserRole from '../enums/UserRole.js'

// 購物車-----------------------------------------------------------------------
const cartSchema = Schema({
  //  外來鍵 Foreign Key (FK)，用來存放來別張資料表的資料主鍵
  p_id: {
    type: ObjectId,
    // 表示此欄位跟products有連結
    ref: 'products',
    required: [true, '使用者購物車商品必填']
  },
  quantity: {
    type: Number,
    required: [true, '使用者購物車商品數量必填'],
    min: [1, '使用者購物車商品數量不符']
  }
})

// 使用者-----------------------------------------------------------------------
const schema = new Schema({
  // 使用者帳號
  account: {
    type: String,
    required: [true, '使用者帳號必填'],
    minlength: [4, '使用者帳號長度不符'],
    maxlength: [20, '使用者帳號長度不符'],
    // 不可重複
    unique: true,
    // 驗證
    validate: {
      validator (value) {
        // 使用套件 validator
        return validator.isAlphanumeric(value)
      },
      message: '使用者帳號格式錯誤'
    }
  },
  // 使用者密碼
  password: {
    type: String,
    required: [true, '使用者密碼必填']
  },
  // 使用者信箱
  email: {
    type: String,
    required: [true, '使用者信箱必填'],
    unique: true,
    validate: {
      validator (value) {
        return validator.isEmail(value)
      },
      message: '使用者信箱格式錯誤'
    }
  },
  tokens: {
    type: [String] // 文字陣列
  },
  cart: {
    type: [cartSchema] // 上方的購物車Schema
  },
  // 區分這個人是一般使用者還是管理員
  role: {
    // 資料型態為數字
    type: Number,
    // 若只寫數字很容易搞不清楚數字代表的值，因此創建資料夾enums的檔案 UserRole
    // 引入檔案 UserRole，預設值為此檔案中的USER
    default: UserRole.USER
  }
}, {
  // 資料庫中建立一個欄位為使用者帳號建立時間
  timestamps: true,
  // 關閉資料改了幾次的紀錄
  versionKey: false
})

// schema.pre() 是 Mongoose 中的一個方法，用於在某些操作（如保存、刪除、更新等）發生之前執行預處理邏輯
// save表示在被保存之前要執行的動作
// 密碼加密
schema.pre('save', function (next) {
  const user = this
  // 如果有修改密碼
  if (user.isModified('password')) {
    // 檢查長度是否超出限制範圍
    if (user.password.length < 4 || user.password.length > 20) {
      const error = new Error.ValidationError()
      error.addError('password', new Error.ValidatorError({ message: '使用者密碼長度不符' }))
      next(error) // 如果有錯誤，將錯誤傳遞給 next()
      return
    } else {
      // 加密
      user.password = bcrypt.hashSync(user.password, 10)
    }
  }
  /* 在 Mongoose 中，next() 函數主要用於中間件（.pre() 和 .post()）中
  中間件允許在特定的操作（如保存、刪除、更新等）之前或之後插入自定義邏輯。next() 函數在中間件中用來將控制權傳遞給下一個中間件或最終的操作。 */
  next()
})

// virtual是建立虛擬的欄位，來顯示購物車右上角的數量
// .get()是寫產生的方式
schema.virtual('cartQuantity').get(function () {
  const user = this // 現在這筆的使用者資料，要用this就不能用箭頭函式
  // .reduce()是JS陣列的方法，將陣列中的每個元素依次執行函式，並將其結果累積為單個值
  return user.cart.reduce((total, current) => {
    // 累加的總數量+現在的數量
    return total + current.quantity
  },
  0 // 表示初始值
  )
})

export default model('users', schema)
