/**
 * @description 数据库连接
 * @author lnden
 */

 const mongoose = require('mongoose')
 const config = require('./index')
 const log4js =require('../utils/log4')
 
 mongoose.connect(config.URL, {
   userNewUrlParser: true,
   useUnifiedTopology: true
 })
 
 const db = mongoose.connection
 
 db.on('error', () => {
   log4js.error('***数据裤连接失败***')
 })
 
 db.on('open', () => {
   log4js.info('*** 数据库连接成功 ***')
 })