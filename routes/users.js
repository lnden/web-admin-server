const router = require('koa-router')()
const User =  require('../models/userSchema')
const util = require('../utils/util')
const jwt = require('jsonwebtoken')

router.prefix('/users')

router.post('/login', async (ctx, next) => {
  try {
    const { userName, userPwd } = ctx.request.body
    /**
     * @description 返回数据库指定的字段 有三种方式
     * 1. 'userId userName userEmail state role deptId roleList'
     * 2. { 'userId': 1, userName: 1, _id: 0 }    1 返回 0 不返回
     * 3. .select('userId')
     */
    const res = await User.findOne({
      userName,
      userPwd
    }, { 'userId': 1, userName: 1, _id: 0 })

    const data = res._doc
    const token = jwt.sign({
      data
     }, 'imooc', { expiresIn: 30 })

    if (res) {
      data.token = token
      ctx.body = util.success(data)
    } else {
      ctx.body = util.fail('账号或密码不正确')
    }
  } catch (error) {
    ctx.body = util.fail(error.msg)
  }
})

module.exports = router
