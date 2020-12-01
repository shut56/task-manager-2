import { combineReducers } from 'redux'
import { connectRouter } from 'connected-react-router'
import tasks from './tasks'

const createRootReducer = (history) =>
  combineReducers({
    router: connectRouter(history),
    tasks
  })

export default createRootReducer
