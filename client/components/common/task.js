import React from 'react'
import { useDispatch } from 'react-redux'
import { changeStatus } from '../../redux/reducers/tasks'

const Task = (props) => {
  const { taskData, category } = props
  const dispatch = useDispatch()
  let status
  switch (taskData.status) {
    case 'in progress':
    case 'blocked': {
      status = 'done'
      break
    }
    default:
      status = 'in progress'
  }
  const blocked = taskData.status === 'blocked' ? 'in progress' : 'blocked'

  return (
    <div>
      <div>{taskData.title}</div>
      <div>{taskData.status}</div>
      <button type="button" className="border rounded" onClick={() => dispatch(changeStatus(category, taskData.taskId, status))}>{status}</button>
      {(taskData.status === 'in progress' || taskData.status === 'blocked') && <button type="button" className="border rounded" onClick={() => dispatch(changeStatus(category, taskData.taskId, blocked))}>{blocked}</button>}
    </div>
  )
}

Task.propTypes = {}

export default React.memo(Task)
