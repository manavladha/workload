import React, { useState } from "react";

const TaskListView = ({ tasks, users, orgMembers, deleteTask, editTaskHandler }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [editTask, setEditTask] = useState(null);
  // Note: update taskDetails field from user_id to org_member_id
  const [taskDetails, setTaskDetails] = useState({ name: "", org_member_id: "", start_date: "", end_date: "", description: "" });

  const sortedTasks = React.useMemo(() => {
    let sortableTasks = [...tasks];
    if (sortConfig.key !== null) {
      sortableTasks.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableTasks;
  }, [tasks, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const handleEdit = (task) => {
    setEditTask(task.id);
    setTaskDetails(task);
  };

  const saveTask = () => {
    editTaskHandler({ id: editTask, ...taskDetails });
    setEditTask(null);
  };

  // Helper: Map task.org_member_id to a user name.
  const getUserNameByTask = (task) => {
    // Ensure both IDs are numbers:
    const member = orgMembers.find(m => Number(m.id) === Number(task.org_member_id));
    if (member) {
      const user = users.find(u => Number(u.id) === Number(member.userId));
      return user ? user.name : "Unknown";
    }
    return "Unknown";
  };

  return (
    <div className="task-list-container">
      <table>
        <thead>
          <tr>
            <th>
              <button type="button" onClick={() => requestSort('name')}>
                Task Name
              </button>
            </th>
            <th>
              <button type="button" onClick={() => requestSort('org_member_id')}>
                Assigned To
              </button>
            </th>
            <th>
              <button type="button" onClick={() => requestSort('start_date')}>
                Start Date
              </button>
            </th>
            <th>
              <button type="button" onClick={() => requestSort('end_date')}>
                End Date
              </button>
            </th>
            <th>Description</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedTasks.map(task => (
            <tr key={task.id}>
              <td>
                {editTask === task.id ? (
                  <input 
                    type="text" 
                    value={taskDetails.name} 
                    onChange={(e) => setTaskDetails({ ...taskDetails, name: e.target.value })} 
                  />
                ) : (
                  task.name
                )}
              </td>
              <td>
                {editTask === task.id ? (
                  <select 
                    value={taskDetails.org_member_id} 
                    onChange={(e) => setTaskDetails({ ...taskDetails, org_member_id: e.target.value })}
                  >
                    {orgMembers.map(member => {
                      const user = users.find(u => Number(u.id) === Number(member.userId));
                      return (
                        <option key={member.id} value={member.id}>
                          {user ? user.name : "Unknown"}
                        </option>
                      );
                    })}
                  </select>
                ) : (
                  getUserNameByTask(task)
                )}
              </td>
              <td>
                {editTask === task.id ? (
                  <input 
                    type="date" 
                    value={taskDetails.start_date} 
                    onChange={(e) => setTaskDetails({ ...taskDetails, start_date: e.target.value })} 
                  />
                ) : (
                  task.start_date
                )}
              </td>
              <td>
                {editTask === task.id ? (
                  <input 
                    type="date" 
                    value={taskDetails.end_date} 
                    onChange={(e) => setTaskDetails({ ...taskDetails, end_date: e.target.value })} 
                  />
                ) : (
                  task.end_date
                )}
              </td>
              <td>
                {editTask === task.id ? (
                  <textarea 
                    value={taskDetails.description} 
                    onChange={(e) => setTaskDetails({ ...taskDetails, description: e.target.value })} 
                  />
                ) : (
                  task.description
                )}
              </td>
              <td>
                {editTask === task.id ? (
                  <button className="primary-button" onClick={saveTask}>Save</button>
                ) : (
                  <>
                    <button className="secondary-button" onClick={() => handleEdit(task)}>Edit</button>
                    <button className="danger-button" onClick={() => deleteTask(task.id)}>Delete</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TaskListView;
