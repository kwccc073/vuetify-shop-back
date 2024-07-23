// 套件
import 'dotenv/config'
import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import { StatusCodes } from 'http-status-codes'
import mongoSanitize from 'express-mongo-sanitize'
import rateLimit from 'express-rate-limit'
import routeUser from './routes/user.js'
import routeProduct from './routes/product.js'
import routeOrder from './routes/order.js'
import './passport/passport.js'

const app = express()

// 一段時間內操作太多次請求會被封ip
// 套件express-rate-limit，參考網站 https://www.npmjs.com/package/express-rate-limit
app.use(rateLimit({
  windowMs: 1000 * 60 * 15, // 時間範圍：15分鐘
  max: 100, // 時間範圍內的請求次數限制
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  statusCode: StatusCodes.TOO_MANY_REQUESTS, // 自訂狀態碼
  message: '太多請求', // 超過上限回應的東西
  // 超出限制時，要如何做後續處理，共四個參數可以用
  // options為上面東西的設定值
  handler (req, res, next, options) {
    res.status(options.statusCode).json({
      success: false,
      message: options.message
    })
  }
}))

// 這裡是因為瀏覽器會擋所以才寫
// cors前面加 '/路由', 則表示只套用到這個路由，沒加則是全部都套用
app.use(cors({
  // origin = 請求的來源
  // callback(錯誤, 是否允許)
  origin (origin, callback) {
    if (origin === undefined ||
      origin.includes('github.io') || origin.includes('localhost') || origin.includes('127.0.0.1')
    ) {
      callback(null, true)
    } else {
      callback(new Error('CORS'), false)
    }
  }
}))

/*
.use() 是 Express.js 中的一個方法，用於將中間件函數掛載到應用程序的路徑上。中間件函數是一組可以訪問請求對象（req）、響應對象（res）和應用程序的請求-響應循環中間的 next 中間件函數的函數。
通過使用 .use()，可以將自定義中間件或內建中間件應用到應用程序的路徑上，從而實現各種功能，如請求解析、驗證、日誌記錄等。
*/
app.use(express.json())
app.use((_, req, res, next) => {
  res.status(StatusCodes.BAD_REQUEST).json({
    success: false,
    message: '資料格式錯誤'
  })
})
// 一定要在express.json()之後
app.use(mongoSanitize())

// 路由
app.use('/user', routeUser)
app.use('/product', routeProduct)
app.use('/order', routeOrder)

app.all('*', (req, res) => {
  res.status(StatusCodes.NOT_FOUND).json({
    success: false,
    message: '找不到'
  })
})

app.listen(process.env.PORT || 4000, async () => {
  console.log('伺服器啟動')
  await mongoose.connect(process.env.DB_URL)
  // mongoose內建的消毒，參考https://thecodebarbarian.com/whats-new-in-mongoose-6-sanitizefilter.html 的Using sanitizeFilter
  mongoose.set('sanitizeFilter', true)
  console.log('資料庫連線成功')
})
