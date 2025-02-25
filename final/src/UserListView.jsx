import React, { useState } from "react";

const UserListView = ({ users, deleteUser, editUserHandler }) => {
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [editUser, setEditUser] = useState(null);
    const [userDetails, setUserDetails] = useState({ name: "", email: "" });

    const sortedUsers = React.useMemo(() => {
        let sortableUsers = [...users];
        if (sortConfig.key !== null) {
            sortableUsers.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableUsers;
    }, [users, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const handleEdit = (user) => {
        setEditUser(user.id);
        setUserDetails(user);
    };

    const saveUser = () => {
        editUserHandler({ id: editUser, ...userDetails });
        setEditUser(null);
    };

    return (
        <div className="task-list-container">
            <table>
                <thead>
                    <tr>
                        <th>
                            <button type="button" onClick={() => requestSort('name')}>
                                Name
                            </button>
                        </th>
                        <th>
                            <button type="button" onClick={() => requestSort('email')}>
                                Email
                            </button>
                        </th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {sortedUsers.map(user => (
                        <tr key={user.id}>
                            <td>
                                {editUser === user.id ? (
                                    <input
                                        type="text"
                                        value={userDetails.name}
                                        onChange={(e) => setUserDetails({ ...userDetails, name: e.target.value })}
                                    />
                                ) : (
                                    user.name
                                )}
                            </td>
                            <td>
                                {editUser === user.id ? (
                                    <input
                                        type="email"
                                        value={userDetails.email}
                                        onChange={(e) => setUserDetails({ ...userDetails, email: e.target.value })}
                                    />
                                ) : (
                                    user.email
                                )}
                            </td>
                            <td>
                                {editUser === user.id ? (
                                    <button class="primary-button" onClick={saveUser}>Save</button>
                                ) : (
                                    <>
                                        <button class="secondary-button" onClick={() => handleEdit(user)}>Edit</button>
                                        <button class="danger-button" onClick={() => deleteUser(user.id)}>Delete</button>
                                        
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

export default UserListView;