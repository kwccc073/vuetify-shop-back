import User from '../models/user.js'
import Product from '../models/product.js'
import { StatusCodes } from 'http-status-codes'
import jwt from 'jsonwebtoken'
import validator from 'validator'

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

// 舊換新-----------------------------------------------------------------------------------------
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

export const editCart = async (req, res) => {
  try {
    if (!validator.isMongoId(req.body.product)) throw new Error('ID')

    const idx = req.user.cart.findIndex(item => item.p_id.toString() === req.body.product)
    if (idx > -1) {
      // 購物車內有這個商品，檢查修改後的數量
      const quantity = req.user.cart[idx].quantity + parseInt(req.body.quantity)
      if (quantity <= 0) {
        // 修改後小於等於 0，刪除
        req.user.cart.splice(idx, 1)
      } else {
        // 修改後還有，修改
        req.user.cart[idx].quantity = quantity
      }
    } else {
      // 購物車內沒這個商品，檢查商品是否存在
      const product = await Product.findById(req.body.product).orFail(new Error('NOT FOUND'))
      if (!product.sell) throw new Error('SELL')

      req.user.cart.push({
        p_id: product._id,
        quantity: req.body.quantity
      })
    }

    await req.user.save()
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
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

export const getCart = async (req, res) => {
  try {
    const result = await User.findById(req.user._id, 'cart').populate('cart.p_id')
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result: result.cart
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}
