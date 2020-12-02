import React, { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { useParams } from 'react-router-dom'
import Head from './head'
import { updateSmth, getTasks } from '../redux/reducers/tasks'

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
        <div className="bg-indigo-800 hover:text-red-500 text-white font-bold rounded-lg border shadow-lg p-10">
          {JSON.stringify(tasks)}
          <button type="button" onClick={() => dispatch(updateSmth())}>
            {' '}
            Add{' '}
          </button>
        </div>
      </div>
    </div>
  )
}

TaskList.propTypes = {}

export default TaskList
