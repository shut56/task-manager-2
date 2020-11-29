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
  const taskList = await readFile(`${__dirname}/tasks/${category}.json`, { encoding: 'utf8' })
    .then((file) => {
      const list = [...JSON.parse(file), newTask]
      toWriteFile(list, category)
      return list
    })
    .catch(async () => {
      await toWriteFile([newTask], category)
      return [newTask]
    })
  res.json(taskList)
})

// GET /api/v1/tasks/:category - получает все массив из фаила тасков и именем `../tasks/${category}.json`,
// без полей, которые начинаются с нижнего подчеркивания кроме тасков с _isDeleted: true

server.get('/api/v1/tasks/:category', async (req, res) => {
  const { category } = req.params
  const data = await readFile(`${__dirname}/tasks/${category}.json`, { encoding: 'utf8' })
    .then((file) =>
      JSON.parse(file)
        .filter((task) => !task._isDeleted)
        .map((obj) => {
          return Object.keys(obj).reduce((acc, key) => {
            if (key[0] !== '_') {
              return { ...acc, [key]: obj[key] }
            }
            return acc
          }, {})
        })
    )
    .catch(() => {
      return ['No category']
    })
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
