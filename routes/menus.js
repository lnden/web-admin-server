/**
 * @description 菜单路由API
 * @author lnden
 */
const router = require('koa-router')()
const util = require('../utils/util')
const Menu = require('../models/menuSchema')

router.prefix('/menu')

router.post('/operate', async (ctx) => {
  const { _id, action, ...params } = ctx.request.body
  let res, info;
  try {
    if (action == 'create') {
      res = await Menu.create(params)
      info = '创建成功'
    } else  if (action == 'edit') {
      delete params._id
      params.updateTime = new Date();
      res = await Menu.findByIdAndUpdate(_id, params) 
      info = '编辑成功'
    } else {
      res = await Menu.findByIdAndRemove(_id)
      await  Menu.deleteMany({ parentId: { $all: [_id] } })
      info = '删除成功'
    }
    ctx.body = util.success('', info)
  } catch (error) {
    ctx.body = util.fail(error.stack)
  }
})

module.exports = router
