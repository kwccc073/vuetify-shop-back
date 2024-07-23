import { Router } from 'express'
import * as auth from '../middlewares/auth.js'
import upload from '../middlewares/upload.js'
import admin from '../middlewares/admin.js'
import { create, getAll, edit, get, getId } from '../controllers/product.js'

const router = Router()

router.post('/', auth.jwt, admin, upload, create)
router.get('/', get)
// all一定要在id前面，不然會被當作id
// 路由/all，要先登入且是管理員再進行functoin
router.get('/all', auth.jwt, admin, getAll)
// 指定id的商品
router.get('/:id', getId)
router.patch('/:id', auth.jwt, admin, upload, edit)

export default router
