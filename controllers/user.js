import User from '../models/user.js'
import Product from '../models/product.js'
import { StatusCodes } from 'http-status-codes'
import jwt from 'jsonwebtoken'
import validator from 'validator'

// 建立帳號--------------------------------------------------------------------------
export const create = async (req, res) => {
  try {
    await User.create(req.body)
    res.status(StatusCodes.OK).json({
      success: true,
      message: ''
    })
  } catch (error) {
    // 驗證錯誤
    if (error.name === 'ValidationError') {
      // 先取出錯誤的第一個東西
      const key = Object.keys(error.errors)[0]
      // 再取錯誤訊息
      const message = error.errors[key].message
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message
      })
    } else if (error.name === 'MongoServerError' && error.code === 11000) {
      res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: '帳號已註冊'
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '未知錯誤'
      })
    }
  }
}

// 登入----------------------------------------------------------------------------
export const login = async (req, res) => {
  try {
    const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7 days' })
    req.user.tokens.push(token)
    await req.user.save()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        // 回傳前端需要的東西
        token,
        account: req.user.account, // 帳號
        role: req.user.role, // 現在是否為管理員
        cart: req.user.cartQuantity // 購物車
      }
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

// 舊換新--------------------------------------------------------------------------
export const extend = async (req, res) => {
  try {
    // 先找索引，找到的token是否等於現在的token
    const idx = req.user.tokens.findIndex(token => token === req.token)
    // expiresIn: '7 days' => JWT七天之後過期
    const token = jwt.sign({ _id: req.user._id }, process.env.JWT_SECRET, { expiresIn: '7 days' })
    // 換成新的token
    req.user.tokens[idx] = token
    await req.user.save()
    // 換掉之後回應成功
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: token
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

// 取自己的資料------------------------------------------------------------------------------
// 當使用者登入之後，只會把token存在local storage裡面，重新整理的話就會需要拿token再去取得一次使用者資料
export const profile = (req, res) => {
  try {
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: {
        // 回傳前端會需要的東西
        // 這裡不需要token，因為token已經在前端了
        account: req.user.account,
        role: req.user.role,
        cart: req.user.cartQuantity
      }
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

// 登出-----------------------------------------------------------------------------------------
// 把現在的token從使用者的token陣列裡移除
export const logout = async (req, res) => {
  try {
    // 不符合現在的token就留下來
    req.user.tokens = req.user.tokens.filter(token => token !== req.token)
    await req.user.save() // 保存
    res.status(StatusCodes.OK).json({
      // 顯示在response
      success: true,
      message: ''
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

// 購物車-----------------------------------------------------------------------------------
// 編輯購物車--------------------------------------
// 一次會回傳兩個東西進來：要加入的商品 id 、數量（相對值，後端去修改）
export const editCart = async (req, res) => {
  try {
    // 先檢查傳入的商品 id 對不對
    if (!validator.isMongoId(req.body.product)) throw new Error('ID')

    // 尋找購物車內是否有傳入的這個商品id：若有 => 改數量、沒有 => 新增
    // 這個req會包含使用者的資訊
    // item.p_id會是MongoDB的格式，需要toString()才能和req.body.product比較
    const idx = req.user.cart.findIndex(item => item.p_id.toString() === req.body.product)
    // idx > -1表示購物車內有這個商品
    if (idx > -1) {
      // 原本購物車內的數量 + 傳入的數量
      const quantity = req.user.cart[idx].quantity + parseInt(req.body.quantity)
      if (quantity <= 0) {
        // 修改後的數量 <= 0，刪除此商品
        // splice(idx, 1)表示從索引刪除一個
        req.user.cart.splice(idx, 1)
      } else {
        // 如果數量還有的話，就調整數量
        req.user.cart[idx].quantity = quantity
      }
    } else {
      // 如果購物車內沒這個商品
      // 檢查這個商品是否存在
      const product = await Product.findById(req.body.product).orFail(new Error('NOT FOUND')) // 沒有找到的話就丟出錯誤'NOT FOUND'
      if (!product.sell) throw new Error('SELL') // 如果下架了就丟出錯誤'SELL'

      req.user.cart.push({
        p_id: product._id,
        quantity: req.body.quantity
      })
    }

    await req.user.save() // 保存
    res.status(StatusCodes.OK).json({
      success: true,
      message: '編輯購物車成功-controller',
      result: req.user.cartQuantity
    })
  } catch (error) {
    if (error.name === 'CastError' || error.message === 'ID') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '商品 ID 格式錯誤'
      })
    } else if (error.message === 'NOT FOUND') {
      res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: '查無商品'
      })
    } else if (error.message === 'SELL') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: '商品已下架'
      })
    } else if (error.name === 'ValidationError') {
      const key = Object.keys(error.errors)[0]
      const message = error.errors[key].message
      res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message
      })
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: '未知錯誤'
      })
    }
  }
}

// 取得使用者的購物車內容（一次取出來回給前端）-----------------------------------
export const getCart = async (req, res) => {
  try {
    // 要先找到使用者，然後只取得他的購物車欄位('cart')
    // 再使用 Mongoose 的 .populate() 方法來填充 cart 中的 p_id 欄位（把商品資訊帶入）
    const result = await User.findById(req.user._id, 'cart').populate('cart.p_id')
    res.status(StatusCodes.OK).json({
      success: true,
      message: '取得購物車成功-controller',
      result: result.cart
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤-controller'
    })
  }
}
