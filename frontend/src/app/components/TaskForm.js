import { useEffect, useState } from 'react';

const TaskForm = ({ task, onSave, onCancel }) => {
  // State for form inputs and UI feedback
  const [taskTitle, setTaskTitle] = useState('');
  const [taskStatus, setTaskStatus] = useState('pending');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showToast, setShowToast] = useState(false);

  // Initialize form based on task prop
  useEffect(() => {
    setTaskTitle(task ? task.task_title : '');
    setTaskStatus(task ? task.task_status : 'pending');
    setFormError('');
  }, [task]);

  /**
   * Handles form submission to create or update a task.
   * @param {Event} event - Form submit event.
   */
  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!taskTitle.trim()) {
      setFormError('Task title is required.');
      return;
    }

    setIsSubmitting(true);
    const method = task ? 'PUT' : 'POST';
    const url = task
      ? `${process.env.NEXT_PUBLIC_API_URL}/tasks/${task.task_id}`
      : `${process.env.NEXT_PUBLIC_API_URL}/tasks`;

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_title: taskTitle, task_status: taskStatus }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || `Failed to ${method === 'PUT' ? 'update' : 'create'} task.`);
      }

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
      onSave();
    } catch (error) {
      setFormError(error.message || `Could not ${method === 'PUT' ? 'update' : 'create'} task.`);
      console.error('API Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Resets form fields to initial state.
   * Optimized for user experience by clearing errors.
   */
  const handleClear = () => {
    setTaskTitle('');
    setTaskStatus('pending');
    setFormError('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-medium text-gray-700">
            {task ? 'Edit Task' : 'Create Task'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-500"
            disabled={isSubmitting}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Error Alert */}
        {formError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            Error: {formError}
          </div>
        )}

        {/* Task Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="task-title">
              Task Title
            </label>
            <input
              id="task-title"
              type="text"
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Enter task title"
              className="w-full p-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              disabled={isSubmitting}
              maxLength={50}
              aria-describedby="title-length"
            />
            <p
              id="title-length"
              className={`text-sm mt-1 ${taskTitle.length >= 45 ? 'text-red-700' : 'text-gray-700'}`}
            >
              {taskTitle.length}/50 characters
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="task-status">
              Status
            </label>
            <select
              id="task-status"
              value={taskStatus}
              onChange={(e) => setTaskStatus(e.target.value)}
              className="w-full p-2.5 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
              disabled={isSubmitting}
            >
              <option value="pending">Pending</option>
              <option value="done">Done</option>
            </select>
          </div>

          {/* Form Buttons */}
          <div className="flex flex-wrap gap-3 justify-end">
            <button
              type="button"
              onClick={handleClear}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:outline-none min-w-[100px] disabled:opacity-50"
              disabled={isSubmitting}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:ring-2 focus:ring-gray-500 focus:outline-none min-w-[100px] disabled:opacity-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:outline-none min-w-[100px] disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : task ? 'Update Task' : 'Add Task'}
            </button>
          </div>
        </form>

        {/* Success Toast */}
        {showToast && (
          <div className="fixed bottom-4 right-4 p-3 bg-green-50 text-green-700 rounded-md shadow-md">
            Success: Task {task ? 'updated' : 'created'} successfully!
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskForm;