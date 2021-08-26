const router = require('koa-router')()
const util = require('../utils/util')
const Dept = require('../models/deptSchema')

router.prefix('/dept')

// 获取部门树形列表
router.get('/list', async (ctx) => {
  let { deptName } = ctx.request.query
  let params = {}
  if (deptName) params.deptName = deptName
  let list = await Dept.find(params)
  if (deptName) {
    ctx.body = util.success(list)
  } else { 
    let treeList = getTreeDpet(list, null, [])
    ctx.body = util.success(treeList)
  }
})

// 递归拼接属性列表
function getTreeDpet(menuList, id, list) {
  for(let i = 0; i < menuList.length; i++) {
    let item = menuList[i]
    if (String(item.parentId.slice().pop()) == String(id)) {
      list.push(item._doc)
    }
  }
  list.map(item => {
     item.children = []
     getTreeDpet(menuList, item._id, item.children)
     if (item.children.length == 0) {
       delete item.children
     }
  })
  return list
}

// 部门操作： 创建/编辑/删除
router.post('/operate', async (ctx) =>{
  const { _id, action, ...params } = ctx.request.body
  let res, info;
  try {
    if (action === 'create') {
      res = await Dept.create(params)
      info = '创建成功'
    } else if (action === 'edit') {
      params.updateTime = new Date()
      res = awaitDept.findByIdAndUpdate(_id, params)
      info = '编辑成功'
    } else {
      res = await Dept.findOneAndRemove(_id)
      Dept.deleteMany({ parentId: { $all: [_id] } })
      info = '删除成功'
    }
    ctx.body = util.success(res, info)
  } catch (error) {
    ctx.body = util.fail(`操作失败： ${error.stack}`)
  }
})

module.exports = router