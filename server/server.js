import express from 'express'
import path from 'path'
import cors from 'cors'
import bodyParser from 'body-parser'
import sockjs from 'sockjs'
import { renderToStaticNodeStream } from 'react-dom/server'
import React from 'react'
import { nanoid } from 'nanoid'

import cookieParser from 'cookie-parser'
import config from './config'
import Html from '../client/html'

const { readFile, writeFile } = require('fs').promises

const Root = () => ''

try {
  // eslint-disable-next-line import/no-unresolved
  // ;(async () => {
  //   const items = await import('../dist/assets/js/root.bundle')
  //   console.log(JSON.stringify(items))

  //   Root = (props) => <items.Root {...props} />
  //   console.log(JSON.stringify(items.Root))
  // })()
  console.log(Root)
} catch (ex) {
  console.log(' run yarn build:prod to enable ssr')
}

const template = {
  taskId: '', // -  nanoid(),
  title: '', // имя таска
  _isDeleted: false, // флаг удален ли таск. Физичически мы таски не удаляем, только помечаем что удален
  _createdAt: 0, // время в секундах от 1,1,1970 до момента создания таска, // read utc format ( +new Date() )
  _deletedAt: 0, // время в секундах от 1,1,1970 до момента удаление таска или null, // read utc format ( +new Date() )
  status: 'new' // ['done', 'new', 'in progress', 'blocked'] - может быть только эти значения и никакие больше
}

const toWriteFile = (fileData, category) => {
  const text = JSON.stringify(fileData)
  writeFile(`${__dirname}/tasks/${category}.json`, text, { encoding: 'utf8' })
}

const toReadFile = (category) => {
  return readFile(`${__dirname}/tasks/${category}.json`, { encoding: 'utf8' }).then((file) =>
    JSON.parse(file)
  )
}

const removeSpecialFields = (tasks) => {
  return tasks
    .filter((task) => !task._isDeleted)
    .map((obj) => {
      return Object.keys(obj).reduce((acc, key) => {
        if (key[0] !== '_') {
          return { ...acc, [key]: obj[key] }
        }
        return acc
      }, {})
    })
}

let connections = []

const port = process.env.PORT || 8090
const server = express()

const middleware = [
  cors(),
  express.static(path.resolve(__dirname, '../dist/assets')),
  bodyParser.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }),
  bodyParser.json({ limit: '50mb', extended: true }),
  cookieParser()
]

middleware.forEach((it) => server.use(it))

server.post('/api/v1/tasks/:category', async (req, res) => {
  const { category } = req.params
  const { title } = req.body
  const newTask = {
    ...template,
    taskId: nanoid(),
    title,
    _createdAt: +new Date()
  }
  const taskList = await toReadFile(category)
    .then((file) => {
      const list = [...file, newTask]
      toWriteFile(list, category)
      return list
    })
    .catch(async () => {
      await toWriteFile([newTask], category)
      return [newTask]
    })
  res.json(taskList)
})

server.get('/api/v1/tasks/:category', async (req, res) => {
  const { category } = req.params
  const data = await toReadFile(category)
    .then((file) => removeSpecialFields(file))
    .catch(() => {
      res.send('what???', 404)
      res.end()
    })
  res.json(data)
})

server.get('/api/v1/tasks/:category/:timespan', async (req, res) => {
  const { category, timespan } = req.params
  const time = {
    day: 86400000,
    week: 604800000,
    month: 2592000000
  }

  const keys = Object.keys(time)
  const index = keys.indexOf(timespan)
  if (index < 0) {
    res.status(404)
    res.end()
  }

  const data = await toReadFile(category)
    .then((file) => {
      return file.filter((task) => {
        return task._createdAt + time[timespan] > +new Date()
      })
    })
    .then((file) => removeSpecialFields(file))
    .catch(() => {
      res.status(404)
      res.end()
    })
  res.json(data)
})

// PATCH /api/v1/tasks/:category/:id - Обновить status с айди id в файле `../tasks/${category}.json` - вернуть обновленный таск.
// Если статус не соответвует заявленным статусам (['done', 'new', 'in progress', 'blocked']) - не обновлять ничего -
// вернуть  статус 501 и ответ {"status" :"error", "message": "incorrect status"}

server.patch('/api/v1/tasks/:category/:id', async (req, res) => {
  const { category, id } = req.params
  const { status } = req.body
  const statusArray = ['done', 'new', 'in progress', 'blocked']
  const check = statusArray.includes(status)
  if (!check) {
    res.status(501)
    res.json({ status: 'error', message: 'incorrect status' })
    res.end()
  }
  const data = await toReadFile(category)
    .then((file) => {
      return file.map((task) => {
        return task.taskId !== id ? task : { ...task, status }
      })
    })
    .catch(() => {
      res.status(404)
      res.end()
    })
  toWriteFile(data, category)
  res.json(data)
})

server.delete('/api/v1/tasks/:category/:id', async (req, res) => {
  const { category, id } = req.params
  const data = await toReadFile(category)
    .then((file) =>
      file.map((task) => {
        return task.taskId !== id ? task : { ...task, _isDeleted: true, _deletedAt: +new Date() }
      })
    )
    .catch(() => {
      res.status(404)
      res.end()
    })
  toWriteFile(data, category)
  res.json(data)
})

server.use('/api/', (req, res) => {
  res.status(404)
  res.end()
})

const [htmlStart, htmlEnd] = Html({
  body: 'separator',
  title: 'Skillcrucial - Become an IT HERO'
}).split('separator')

server.get('/', (req, res) => {
  const appStream = renderToStaticNodeStream(<Root location={req.url} context={{}} />)
  res.write(htmlStart)
  appStream.pipe(res, { end: false })
  appStream.on('end', () => {
    res.write(htmlEnd)
    res.end()
  })
})

server.get('/*', (req, res) => {
  const initialState = {
    location: req.url
  }

  return res.send(
    Html({
      body: '',
      initialState
    })
  )
})

const app = server.listen(port)

if (config.isSocketsEnabled) {
  const echo = sockjs.createServer()
  echo.on('connection', (conn) => {
    connections.push(conn)
    conn.on('data', async () => {})

    conn.on('close', () => {
      connections = connections.filter((c) => c.readyState !== 3)
    })
  })
  echo.installHandlers(app, { prefix: '/ws' })
}
console.log(`Serving at http://localhost:${port}`)
