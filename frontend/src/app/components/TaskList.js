import { useEffect, useState } from 'react';
import TaskForm from './TaskForm';

const TaskList = () => {
  // State for tasks and UI controls
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  /**
   * Fetches tasks from the backend API.
   * Includes error handling and loading state.
   */
  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks`);
      if (!response.ok) {
        throw new Error('Failed to fetch tasks.');
      }
      const data = await response.json();
      setTasks(data);
      setErrorMsg('');
    } catch (error) {
      setErrorMsg('Error loading tasks. Please try again.');
      console.error('Fetch Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, []);

  /**
   * Deletes a task by ID and refreshes the task list.
   * @param {number} id - Task ID to delete.
   */
  const handleDelete = async (id) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tasks/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete task.');
      }
      fetchTasks();
      setConfirmDeleteId(null);
    } catch (error) {
      setErrorMsg(error.message || 'Error deleting task.');
      console.error('Delete Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handles task save (create/edit) and refreshes the list.
   * Closes the form modal.
   */
  const handleSave = () => {
    setShowForm(false);
    setEditTask(null);
    fetchTasks();
  };

  // Filter tasks by status and search query with pluralized count
  const filteredTasks = tasks.filter(
    (task) =>
      (filterStatus === 'all' || task.task_status === filterStatus) &&
      task.task_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <h1 className="text-3xl font-bold text-gray-700 text-center">
        Task Manager
      </h1>

      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-200 p-4 rounded-lg">
        <div className="flex items-center w-full sm:w-1/3">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
            aria-label="Search tasks"
          />
          <span className="ml-2 text-sm text-gray-700">
            ({filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'})
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              filterStatus === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
            } focus:ring-2 focus:ring-blue-500 focus:outline-none`}
          >
            All
          </button>
          <button
            onClick={() => setFilterStatus('pending')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              filterStatus === 'pending'
                ? 'bg-yellow-500 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
            } focus:ring-2 focus:ring-yellow-500 focus:outline-none`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilterStatus('done')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition ${
              filterStatus === 'done'
                ? 'bg-green-500 text-white'
                : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
            } focus:ring-2 focus:ring-green-500 focus:outline-none`}
          >
            Done
          </button>
          <button
            onClick={() => {
              setShowForm(true);
              setEditTask(null);
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            Add Task
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md">
          Error: {errorMsg}
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && (
        <div className="text-center py-10 text-gray-700">
          Loading...
        </div>
      )}

      {/* Task Form Modal */}
      {showForm && (
        <TaskForm
          task={editTask}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditTask(null);
          }}
        />
      )}

      {/* Task List */}
      {filteredTasks.length === 0 && !isLoading ? (
        <div className="text-center py-10 text-gray-700">
          No tasks found. Try adding one or adjusting the filter.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task) => (
            <div
              key={task.task_id}
              className="p-4 bg-white border border-gray-200 rounded-md shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-gray-700">{task.task_title}</h3>
                  <span
                    className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-md ${
                      task.task_status === 'done'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {task.task_status.charAt(0).toUpperCase() + task.task_status.slice(1)}
                  </span>
                  <p className="text-sm text-gray-700 mt-2">
                    Created: {new Date(task.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setEditTask(task);
                      setShowForm(true);
                    }}
                    className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmDeleteId(task.task_id)}
                    className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:outline-none"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Confirm Delete</h3>
            <p className="text-gray-700 mb-6">Are you sure you want to delete this task?</p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:outline-none"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDeleteId)}
                className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 focus:ring-2 focus:ring-red-500 focus:outline-none"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;