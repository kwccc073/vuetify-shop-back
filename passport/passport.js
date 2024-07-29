// 登入---------------------------------------------------------------------------------------------
// 引入登入認證用的套件
import passport from 'passport'
import passportLocal from 'passport-local'
import passportJWT from 'passport-jwt'
// 引入加密用套件
import bcrypt from 'bcrypt'
import User from '../models/user.js'

// 建立名為login的驗證方式（使用passportLocal的驗證策略）
passport.use('login', new passportLocal.Strategy({
  // 檢查account和password這兩個欄位是否存在
  // 預設是username和password，所以寫這兩行來修改檢查欄位的名稱
  usernameField: 'account',
  passwordField: 'password'
}, async (account, password, done) => {
  // 檢查通過的話再執行這個function
  try {
    // 找是否有帳號符合傳入的帳號
    const user = await User.findOne({ account }) // await要記得加
    if (!user) {
      // 找不到就拋出錯誤
      throw new Error('ACCOUNT')
    }
    // 若密碼不正確，拋出錯誤
    if (!bcrypt.compareSync(password, user.password)) {
      throw new Error('PASSWORD')
    }
    // 有的話就傳出使用者資料
    return done(null, user, null)
  } catch (error) {
    console.log(error) // 用於debug
    if (error.message === 'ACCOUNT') {
      // done()為套件Passport裡的函式
      // 三個值分別表示沒有發生錯誤、表示沒有用戶資料、附加的訊息
      return done(null, null, { message: '使用者帳號不存在' })
    } else if (error.message === 'PASSWORD') {
      return done(null, null, { message: '使用者密碼錯誤' })
    } else {
      return done(null, null, { message: '未知錯誤' })
    }
  }
}))

// JWT的驗證機制-------------------------------------------------------------------------------
// 設定一個名為jwt的驗證方式，使用passportJWT策略
passport.use('jwt', new passportJWT.Strategy({
  jwtFromRequest: passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken(), // 設定JWT的來源
  secretOrKey: process.env.JWT_SECRET, // 用.env的JWT_SECRET (隨便打) 去驗證
  passReqToCallback: true, // 要加這行下面才可用req
  // 忽略過期的檢查 (jwt過期了一樣可以過)，因為舊換新的時候要允許過期的jwt執行
  ignoreExpiration: true
}, async (req, payload, done) => {
  // payload 為解出來的資訊、done為進到下一步的function
  // 取得請求的資訊
  try {
    // exp表示過期的時間，單位為毫秒
    // new Date().getTime()是現在時間
    // 答案為true，表示已過期
    const expired = payload.exp * 1000 < new Date().getTime()

    /*
      如果網址為http://localhost:4000/user/test?aaa=111&bbb=222
      則
      req.originUrl = /user/test?aaa=111&bbb=222
      req.baseUrl = /user
      req.path = /test
      req.query = { aaa: 111, bbb: 222 }
    */

    const url = req.baseUrl + req.path
    // 如果過期了且網址不是舊換新也不是登出 => 拋出過期的錯誤
    if (expired && url !== '/user/extend' && url !== '/user/logout') {
      throw new Error('EXPIRED')
    }

    // 把 JWT 取出來
    const token = passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken()(req)
    // 在資料庫找使用者是否有人符合這個ID
    const user = await User.findOne({ _id: payload._id, tokens: token })
    if (!user) {
      // 沒有的話就拋出錯誤
      throw new Error('JWT')
    }

    return done(null, { user, token }, null)
  } catch (error) {
    // 處理不同的錯誤
    console.log(error)
    if (error.message === 'EXPIRED') {
      return done(null, null, { message: '登入過期' })
    } else if (error.message === 'JWT') {
      return done(null, null, { message: '登入無效' })
    } else {
      return done(null, null, { message: '未知錯誤' })
    }
  }
}))
