const Koa = require('koa')
const app = new Koa()
const views = require('koa-views')
const json = require('koa-json')
const router = require('koa-router')()
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const log4js = require('./utils/log4')
 
require('./conf/db')

const users = require('./routes/users')

// error handler
onerror(app)

// middlewares
app.use(bodyparser({
  enableTypes:['json', 'form', 'text']
}))
app.use(json())
app.use(logger())
app.use(require('koa-static')(__dirname + '/public'))

app.use(views(__dirname + '/views', {
  extension: 'pug'
}))

// 定义一个错误测试log4js
// app.use(() => {
//   ctx.body = 'below on error'
// })

// logger
app.use(async (ctx, next) => {
  await next()
  log4js.info(`get params: ${JSON.stringify(ctx.request.query)}`)
  log4js.info(`post params: ${JSON.stringify(ctx.request.body)}`)
})

router.prefix('/api')
router.use(users.routes(), users.allowedMethods())
// routes
app.use(users.routes(), users.allowedMethods())

// error-handling
app.on('error', (err, ctx) => {
  console.error('server error', err, ctx)
  // log4js.error(err)
});

module.exports = app
