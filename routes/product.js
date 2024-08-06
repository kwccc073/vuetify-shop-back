import { Router } from 'express'
import * as auth from '../middlewares/auth.js'
import upload from '../middlewares/upload.js'
import admin from '../middlewares/admin.js' // 只有管理員可以經過的middlewares
import { create, getAll, edit, get, getId } from '../controllers/product.js'

const router = Router()
// auth.jwt：判斷是哪位使用者
// admin：判斷是否為管理員
// 建立歌曲---------------------------------------
router.post('/', auth.jwt, admin, upload, create)
// 顯示商品的表格用---------------------------------
// 一般人（只看得到有上架的）
router.get('/', get)
// 管理員（有無上架都看的到）：要登入、且是管理員
// /all一定要在:id前面，不然all會被當作id
router.get('/all', auth.jwt, admin, getAll)

// 取得指定id的商品 /:id
router.get('/:id', getId)
// 編輯商品----------------------------------------
router.patch('/:id', auth.jwt, admin, upload, edit)

export default router
