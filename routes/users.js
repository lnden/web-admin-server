const router = require('koa-router')()
const User =  require('../models/userSchema')
const Menu = require('../models/menuSchema')
const Role = require('../models/roleSchema')
const Counter = require('../models/counterSchema')
const util = require('../utils/util')
const jwt = require('jsonwebtoken')
const md5 = require('md5')

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
     }, 'imooc', { expiresIn: '1h' })

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

// 用户列表
router.get('/list', async (ctx) => {
  const { userId, userName, state } = ctx.request.query
  const { page, skipIndex } = util.pager(ctx.request.query)
  let params = {}
  if (userId) params.userId = userId
  if (userName) params.userName = userName
  if (state && state != '0') params.state = state

  try {
    // 根据条件查询所有用户列表
    const query = User.find(params, { _id: 0, userPwd: 0 })
    // 从第几条开始查询， 查询多少条数据
    const result = await query.skip(skipIndex).limit(page.pageSize)
    const total = await User.countDocuments(params)

    ctx.body = util.success({
      page: {
        ...page,
        total
      },
      list: result
    })
  } catch (error) {
    ctx.body = util.fail(`查询异常： ${error.stack}`)
  }
})

// 获取全量用户列表
router.get('/allList', async (ctx) => {
  try {
    const list =  await User.find({}, 'userId userName userEmail')
    ctx.body = util.success(list)
  } catch (error) {
    ctx.body = util.fail(error.stack)
  }
})

// 用户删除/批量删除
router.post('/delete', async (ctx) => {
  // 待删除的用户ID
  const { userIds } = ctx.request.body
  // User.updateMany({userId: ['10001']}, { state:2 })
  // User.updateMany({ $or: [{ userId: 10001 }, { userId: 10002 }] })
  const res = await User.updateMany({ userId: { $in: userIds }}, { state: 2 })
  if (res.nModified) {
    ctx.body = util.success(res, `共删除成功${res.nModified}条`)
    return
  }
  ctx.body = util.fail('删除失败')
})

// 用户新增/编辑
router.post('/operate', async (ctx) => {
  const { userId, userName, userEmail, job, mobile, state, roleList, deptId, action } = ctx.request.body 
  if (action == 'create') {
    if (!userName || !userEmail || !deptId) {
      ctx.body = util.fail('参数错误', util.CODE.PARM_ERROR)
      return
    }
    const res = await User.findOne({$or: [ { userName }, { userEmail } ]}, '_id userName userEmail')
    if(res) {
      ctx.body = util.fail(`系统检测到有重复的用户，信息如下：${res.userName} - ${res.userEmail}`)
    } else {
      // 每次查找用户ID是userId, 自增长 +1
      const doc = await Counter.findOneAndUpdate({ _id: 'userId' }, { $inc: { sequence_value: 1 } }, { new: true })
      try {
        const user = new User({
          userId: doc.sequence_value,
          userName,
          userPwd: md5('123456'),
          userEmail,
          role: 1, // 默认普通用户
          roleList,
          job,
          state,
          deptId,
          mobile
        })
        user.save()
        ctx.body = util.success(true, '用户创建成功')
      } catch (error) {
        ctx.body = util.fail(error.stack, '用户创建失败')
      }
    }
  } else {
    if (!deptId) {
      ctx.body = util.fail('部门不能为空', util.CODE.PARM_ERROR)
      return
    }

    try {
      const res = await User.findOneAndUpdate({ userId }, { job, mobile, state, roleList,deptId})
      ctx.body = util.success(true, '更新成功')
    } catch (error) {
      ctx.body = util.fail(res, '更新失败')
    }
  }
})

// 获取用户对应的权限菜单
router.get('/getPermissionList', async (ctx) => {
  let authorization = ctx.request.headers.authorization
  let { data } = util.decoded(authorization)
  let menuList = await getMenuList(data.role, data.roleList)
  ctx.body = util.success(menuList)
})

/**
 * 
 * @param {角色} userRole 0 => 管理员 1 => 普通用户
 * @param {权限} roleKeys 
 * @returns 
 */
async function getMenuList(userRole, roleKeys) {
  let rootList = []
  if (userRole == 0) {
    rootList = await Menu.find({}) || []
  } else {
    // 1.根据用户拥有的角色，获取权限列表
    // 2.查找用户对应的角色有哪些
    let roleList = await Role.find({ _id: { $in: roleKeys } })
    let permissionList = []
    roleList.map(role => {
      let { checkedKeys, halfCheckedKeys } = role.permissionList
      permissionList = permissionList.concat([...checkedKeys, ...halfCheckedKeys])
    })
    permissionList = [...new Set(permissionList)]
    rootList = await Menu.find({ _id: { $in: permissionList } })
  }
  return util.getTreeMenu(rootList, null, [])
}

module.exports = router
