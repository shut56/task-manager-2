import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'
import Head from './head'
import { updateSmth, getTasks } from '../redux/reducers/tasks'
import Task from './common/task'

const TaskList = () => {
  const dispatch = useDispatch()
  const { category } = useParams()
  const tasks = useSelector((s) => s.tasks.listOfTasks)
  useEffect(() => {
    dispatch(getTasks(category))
  }, [dispatch, category])
  return (
    <div>
      <Head title="TaskList" />
      <div className="flex items-center justify-center h-screen">
        <div className="bg-indigo-800 text-white font-bold rounded-lg border shadow-lg p-10">
          {tasks.map((item) => <Task category={category} taskData={item} key={item.taskId} />)}
          <button type="button" className="border rounded" onClick={() => dispatch(updateSmth())}>
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

TaskList.propTypes = {}

export default TaskList
