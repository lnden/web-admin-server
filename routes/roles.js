/**
 * @description 角色路由 API
 * @author lnden
 */
const router = require('koa-router')()
const Role = require('../models/roleSchema')
const util = require('../utils/util')

router.prefix('/roles')

// 查询所有角色列表[名称和ID]
router.get('/allList', async (ctx) => {
  try {
    // find 查询所有
    const list = await Role.find({}, "_id roleName")
    ctx.body = util.success(list)
  } catch (error) {
    ctx.body = util.fail(`查询失败： ${error.stack}`)
  }
})

// 查询角色列表[分页]
router.get('/list', async (ctx) => {
  const { roleName } = ctx.request.query
  const { page, skipIndex } = util.pager(ctx.request.query)
  try {
    let params = {}
    if(roleName) params.roleName = roleName
    const query = Role.find(params)
    const list = await query.skip(skipIndex).limit(page.pageSize)
    const total = await Role.countDocuments(params)
    ctx.body = util.success({
      list, 
      page: {
        ...page,
        total
      }
    })
  } catch (error) {
    ctx.body = util.fail(`查询失败: ${error.stack}`)
  }
})

// 角色操作： 创建、编辑和删除
router.post('/operate', async (ctx) => {
  const { _id, action, roleName, remark } = ctx.request.body
  let res, info;
  try {
    if (action == 'create') {
      res = await Role.create({ roleName, remark })
      info = '创建成功'
    } else if (action == 'edit') {
      if (!_id) {
        ctx.body = util.fail('缺少参数params: _id')
        return
      } 
      let params = { roleName, remark } 
      params.updateTime = new Date()
      res = await Role.findByIdAndUpdate(_id, params) 
      info = '编辑成功'
    } else {
      if (!_id) {
        ctx.body = util.fail('缺少参数params: _id')
        return
      } 
      res = await Role.findByIdAndRemove(_id)
      info = '删除成功'
    }
    ctx.body = util.success(res, info)
  } catch (error) {
    ctx.body = util.fail(`操作失败: ${error.stack}`)
  }
})

// 权限设置
router.post('/update/permission', async (ctx) => {
  const { _id, permissionList } = ctx.request.body
  try {
    let params = {  
      updateTime: new Date(),
      permissionList
    }
    let res = await Role.findByIdAndUpdate(_id, params)
    ctx.body = util.success(res, '权限设置成功')
  } catch (error) {
    ctx.body = util.fail(`权限设置失败：${error.stack}`)
  }
})

module.exports = router