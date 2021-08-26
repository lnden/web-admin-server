/**
 * @description 部门管理模型
 * @author lnden
 */
const mongoose = require('mongoose')

const deptSchema = mongoose.Schema({
  deptName: String,
  userId: String,
  userName: String,
  userEmail: String,
  parentId: [mongoose.Types.ObjectId],
  updateTime: {
    type: Date,
    default: Date.now()
  },
  createTime: {
    type: Date,
    default: Date.now()
  },
})

module.exports = mongoose.model('dept', deptSchema, 'depts')