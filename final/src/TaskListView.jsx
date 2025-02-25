import React, { useState } from "react";

const TaskListView = ({ tasks, users, deleteTask, editTaskHandler }) => {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [editTask, setEditTask] = useState(null);
    const [taskDetails, setTaskDetails] = useState({ name: "", user_id: "", start_date: "", end_date: "", description: "" });

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
                            <button type="button" onClick={() => requestSort('user_id')}>
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
                                {editTask === task.id ? <input type="text" value={taskDetails.name} onChange={(e) => setTaskDetails({ ...taskDetails, name: e.target.value })} /> : task.name}
                            </td>
                            <td>
                                {editTask === task.id ? (
                                    <select value={taskDetails.user_id} onChange={(e) => setTaskDetails({ ...taskDetails, user_id: e.target.value })}>
                                        {users.map(user => (
                                            <option key={user.id} value={user.id}>{user.name}</option>
                                        ))}
                                    </select>
                                ) : (
                                    users.find(user => user.id === task.user_id)?.name
                                )}
                            </td>
                            <td>
                                {editTask === task.id ? <input type="date" value={taskDetails.start_date} onChange={(e) => setTaskDetails({ ...taskDetails, start_date: e.target.value })} /> : task.start_date}
                            </td>
                            <td>
                                {editTask === task.id ? <input type="date" value={taskDetails.end_date} onChange={(e) => setTaskDetails({ ...taskDetails, end_date: e.target.value })} /> : task.end_date}
                            </td>
                            <td>
                                {editTask === task.id ? <textarea value={taskDetails.description} onChange={(e) => setTaskDetails({ ...taskDetails, description: e.target.value })} /> : task.description}
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