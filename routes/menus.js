/**
 * @description 菜单路由API
 * @author lnden
 */
const router = require('koa-router')()
const util = require('../utils/util')
const Menu = require('../models/menuSchema')

router.prefix('/menu')

// 菜单列表查询
router.get('/list', async (ctx) => {
  const { menuName, menuState } = ctx.request.query
  const params = {}
  if (menuName)params.menuName = menuName
  if (menuState)params.menuState = menuState
  const result = await Menu.find(params) || []
  const permissionList = getTreeMenu(result, null, [])
  ctx.body = util.success(permissionList)
})

// 递归拼接属性列表
function getTreeMenu(menuList, id, list) {
  for(let i = 0; i < menuList.length; i++) {
    let item = menuList[i]
    if (String(item.parentId.slice().pop()) == String(id)) {
      list.push(item._doc)
    }
  }
  list.map(item => {
     item.children = []
     getTreeMenu(menuList, item._id, item.children)
     if (item.children.length == 0) {
       delete item.children
     } else if (item.children.length > 0 && item.children[0].menuType == 2) {
       // 快速区分按钮和菜单， 用于后期做菜单按钮权限控制
       item.action = item.children
      //  delete item.children
     }
  })
  return list
}

// 菜单的增/删/改查功能
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
