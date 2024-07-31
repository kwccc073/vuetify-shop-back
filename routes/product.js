import { Router } from 'express'
import * as auth from '../middlewares/auth.js'
import upload from '../middlewares/upload.js' // 照片上傳用
import admin from '../middlewares/admin.js' // 只有管理員可以經過的middlewares
import { create, getAll, edit, get, getId } from '../controllers/product.js'

const router = Router()
// auth.jwt：判斷是哪位使用者
// admin：判斷是否為管理員
router.post('/', auth.jwt, admin, upload, create)
router.get('/', get)
// all一定要在id前面，不然會被當作id
// 路由/all，要先登入且是管理員再進行functoin
router.get('/all', auth.jwt, admin, getAll)
// 指定id的商品
router.get('/:id', getId)
router.patch('/:id', auth.jwt, admin, upload, edit)

export default router
