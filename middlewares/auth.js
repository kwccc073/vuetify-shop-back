// 登入用--------------------------------------------------------------------------------------
// 引入登入認證用的套件
import passport from 'passport'
// 引入狀態碼
import { StatusCodes } from 'http-status-codes'
// 引入jwt套件
import jsonwebtoken from 'jsonwebtoken'

export const login = (req, res, next) => {
  // passport.authenticate('login' => 會先跳到資料夾passport的passport.js裡的名為login的驗證方式
  // 先檢查有沒有帳號密碼欄位，成功跑完才繼續下方內容
  // passport.js裡的 done( , , )的三個參數會對應到(error, user, info)
  passport.authenticate('login', { session: false }, (error, user, info) => {
    if (!user || error) {
      if (info.message === 'Missing credentials') {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: '輸入欄位錯誤'
        })
        return
      } else if (info.message === '未知錯誤') {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: '未知錯誤'
        })
        return
      } else {
        res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: info.message
        })
        return
      }
    }
    req.user = user
    next()
  })(req, res, next)
}

// JWT的驗證---------------------------------------------------------------------------------------
export const jwt = (req, res, next) => {
  // passport.authenticate('jwt' => 會先跳到資料夾passport的passport.js裡的名為jwt的驗證方式，成功跑完才繼續下方內容
  passport.authenticate('jwt', { session: false }, (error, data, info) => {
    if (error || !data) {
      // info 是 JsonWebTokenError 類型的實例時
      if (info instanceof jsonwebtoken.JsonWebTokenError) {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: '登入無效'
        })
      } else if (info.message === '未知錯誤') {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
          success: false,
          message: '未知錯誤'
        })
      } else {
        res.status(StatusCodes.UNAUTHORIZED).json({
          success: false,
          message: info.message
        })
      }
      return
    }
    req.user = data.user
    req.token = data.token
    next()
  })(req, res, next)
}
