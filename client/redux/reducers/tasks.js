import axios from 'axios'

const GET_TASKS = 'GET_TASKS'
const UPDATE_SMTH = 'UPDATE_SMTH'
const CHANGE_STATUS = 'CHANGE_STATUS'

const initialState = {
  listOfTasks: []
}

export default (state = initialState, action) => {
  switch (action.type) {
    case UPDATE_SMTH: {
      return { ...state, listOfTasks: [...state.listOfTasks, action.new] }
    }
    case GET_TASKS: {
      return { ...state, listOfTasks: action.listOfTasks }
    }
    case CHANGE_STATUS: {
      return { ...state, listOfTasks: action.changedStatus }
    }
    default:
      return state
  }
}

export function getTasks(category) {
  return (dispatch) => {
    console.log('Hello from redux')
    axios(`/api/v1/tasks/${category}`)
      .then(({ data }) => {
        console.log('Hello from axios')
        dispatch({ type: GET_TASKS, listOfTasks: data })
      })
      .catch(() => {
        console.log('Hello from catch')
        dispatch({ type: GET_TASKS, listOfTasks: ['Error'] })
      })
  }
}

export function updateSmth() {
  return { type: UPDATE_SMTH, new: 'blabla' }
}

/*
  axios({
    method: 'post',
    url: '/user/12345',
    data: {
      firstName: 'Fred',
      lastName: 'Flintstone'
    }
  })
*/

export function changeStatus(category, id, status) {
  return (dispatch, getState) => {
    const store = getState()
    const { listOfTasks } = store.tasks
    const changedStatus = listOfTasks.map((item) => ((item.taskId === id) ? ({...item, status}) : item))
    dispatch({ type: CHANGE_STATUS, changedStatus })
    axios({
      method: 'patch',
      url: `/api/v1/tasks/${category}/${id}`,
      data: {
        status
      }
    })
  }
}
