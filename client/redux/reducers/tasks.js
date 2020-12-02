import axios from 'axios'

const GET_TASKS = 'GET_TASKS'
const UPDATE_SMTH = 'UPDATE_SMTH'

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
