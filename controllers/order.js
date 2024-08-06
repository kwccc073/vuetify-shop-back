import Order from '../models/order.js'
import User from '../models/user.js'
import { StatusCodes } from 'http-status-codes'

// 建立訂單-----------------------------------------------------------------------------------
export const create = async (req, res) => {
  try {
    // 檢查購物車有沒有東西
    if (req.user.cart.length === 0) throw new Error('EMPTY')
    // 檢查有沒有下架商品－重新執行查詢
    const user = await User.findById(req.user._id, 'cart').populate('cart.p_id') // 使用者資訊
    // .every()檢查是否每個東西都有上架
    const ok = user.cart.every(item => item.p_id.sell)
    if (!ok) throw new Error('SELL')

    // 建立訂單---------------------
    await Order.create({
      user: req.user._id,
      cart: req.user.cart
    })

    req.user.cart = [] // 清空購物車
    await req.user.save() // 保存使用者

    // 回應---------------------------
    res.status(StatusCodes.OK).json({
      success: true,
      message: '建立訂單成功-controller'
    })
  } catch (error) {
    if (error.name === 'EMPTY') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: true,
        message: '購物車是空的-controller'
      })
    } else if (error.name === 'SELL') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: true,
        message: '包含下架商品-controller'
      })
    } else if (error.name === 'SELL') {
      res.status(StatusCodes.BAD_REQUEST).json({
        success: true,
        message: '包含下架商品-controller'
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
        message: '未知錯誤-controller'
      })
    }
  }
}

// 查詢自己的訂單 for 一般使用者-------------------------------------------------------------------------
export const get = async (req, res) => {
  try {
    const result = await Order.find({ user: req.user._id }).populate('cart.p_id')
    res.status(StatusCodes.OK).json({
      success: true,
      message: '查詢訂單成功-controller',
      result
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}

// 查詢全部 for 管理員-------------------------------------------------------------------------
export const getAll = async (req, res) => {
  try {
    // 查全部的.find()不須放條件
    // .populate('user', 'account') => 要找出user的account
    const result = await Order.find().populate('user', 'account').populate('cart.p_id')
    res.status(StatusCodes.OK).json({
      success: true,
      message: '',
      result
    })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: '未知錯誤'
    })
  }
}
