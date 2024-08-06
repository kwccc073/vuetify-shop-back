import { Router } from 'express'
import * as auth from '../middlewares/auth.js'
import admin from '../middlewares/admin.js'
import { create, getAll, get } from '../controllers/order.js'

const router = Router()

// 建立訂單-------------------------------
router.post('/', auth.jwt, create)
// 取自己的 for 一般使用者------------------
router.get('/', auth.jwt, get)
// 取全部 for 管理員------------------
router.get('/all', auth.jwt, admin, getAll)

export default router
