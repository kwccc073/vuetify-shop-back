// 此檔案用於判斷是否為管理員
import UserRole from '../enums/UserRole.js'
import { StatusCodes } from 'http-status-codes'

export default (req, res, next) => {
  // 如果不是管理員
  if (req.user.role !== UserRole.ADMIN) {
    // FORBIDDEN 知道是誰但沒權限
    res.status(StatusCodes.FORBIDDEN).json({
      success: true,
      message: '沒有權限'
    })
  } else {
    next() // 進到下一步
  }
}
