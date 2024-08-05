// 引入建構api的套件
import { Router } from 'express'
import { create, login, extend, profile, logout, editCart, getCart } from '../controllers/user.js'
import * as auth from '../middlewares/auth.js'

const router = Router()

// 建立帳號-----------------------------------------
router.post('/', create)
// 登入要經過auth.login的欄位檢查-------------------
router.post('/login', auth.login, login)
// 舊換新------------------------------------------
router.patch('/extend', auth.jwt, extend)
// 取自己的資料-------------------------------------
router.get('/profile', auth.jwt, profile)
// 登出--------------------------------------------
router.delete('/logout', auth.jwt, logout)
// 購物車-----------------------------------------
router.patch('/cart', auth.jwt, editCart) // 編輯
router.get('/cart', auth.jwt, getCart)

export default router
