import React, { useState, useEffect } from "react";
import axios from "axios";
import GanttChartComponent from "./GanttChartComponent";
import TaskListView from "./TaskListView";
import UserListView from "./UserListView";
import TaskGanttView from "./TaskGanttView";
import "./index.css";
import { useNavigate } from "react-router-dom";

function App() {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [orgMembers, setOrgMembers] = useState([]);
  const [viewMode, setViewMode] = useState("week");
  const [startDate, setStartDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("gantt");
  const [newUser, setNewUser] = useState({ name: "", email: "" });
  const [newTask, setNewTask] = useState({
    name: "",
    userId: "",
    startDate: "",
    endDate: "",
    description: "",
  });
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [userOrgs, setUserOrgs] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);

  const navigate = useNavigate();

  // New function to fetch all organizations the logged-in user belongs to
  const fetchUserOrgs = async () => {
    try {
      const loggedInUser = JSON.parse(localStorage.getItem('user'));
      const response = await axios.get("http://localhost:8000/user-organizations/", { 
        params: { userId: loggedInUser.user_id || loggedInUser.id }
      });
      setUserOrgs(response.data);
      if (response.data.length > 0 && !selectedOrg) {
        setSelectedOrg(response.data[0].id);
      }
    } catch (error) {
      console.error("Error fetching user organizations", error);
    }
  };

  // Re-fetch data whenever the selected organization changes.
  useEffect(() => {
    fetchUserOrgs();
  }, []);

  useEffect(() => {
    if (selectedOrg) {
      fetchUsers();
      fetchOrgMembers();
      fetchTasks();
    }
  }, [selectedOrg]);

  // Updated to use the new /users/ endpoint that fetches via orgMembers join
  const fetchUsers = async () => {
    try {
      const response = await axios.get("http://localhost:8000/users/", { params: { orgId: selectedOrg } });
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users", error);
    }
  };

  const fetchOrgMembers = async () => {
    try {
      const response = await axios.get("http://localhost:8000/orgmembers/", { params: { orgId: selectedOrg } });
      setOrgMembers(response.data);
    } catch (error) {
      console.error("Error fetching org members", error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await axios.get("http://localhost:8000/tasks/", { params: { orgId: selectedOrg } });
      setTasks(response.data);
    } catch (error) {
      console.error("Error fetching tasks", error);
    }
  };

  const addUser = async () => {
    try {
      const payload = {
        ...newUser,
        orgId: selectedOrg
      };
      await axios.post("http://localhost:8000/users/", payload);
      fetchUsers();
      setIsUserModalOpen(false);
      setNewUser({ name: "", email: "" });
    } catch (error) {
      console.error("Error adding user", error);
    }
  };

  // Updated addTask: map selected user to the orgMember record using /orgmember/byuserorg/
  const addTask = async () => {
    try {
      const mappingRes = await axios.get("http://localhost:8000/orgmember/byuserorg/", { 
        params: { userId: newTask.userId, orgId: selectedOrg } 
      });
      const orgMemberId = mappingRes.data.id;
      
      await axios.post("http://localhost:8000/tasks/", {
        name: newTask.name,
        org_member_id: parseInt(orgMemberId),
        start_date: newTask.startDate,
        end_date: newTask.endDate,
        description: newTask.description,
      });
      fetchTasks();
      setIsTaskModalOpen(false);
      setNewTask({ name: "", userId: "", startDate: "", endDate: "", description: "" });
    } catch (error) {
      console.error("Error adding task", error);
    }
  };

  const deleteUser = async (userId) => {
    try {
      await axios.delete(`http://localhost:8000/users/${userId}`);
      setUsers(users.filter((user) => user.id !== userId));
    } catch (error) {
      console.error("Error deleting user", error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      await axios.delete(`http://localhost:8000/tasks/${taskId}`);
      setTasks(tasks.filter((task) => task.id !== taskId));
    } catch (error) {
      console.error("Error deleting task", error);
    }
  };

  const editUserHandler = async (updatedUser) => {
    try {
      await axios.put(`http://localhost:8000/users/${updatedUser.id}`, updatedUser);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user", error);
    }
  };

  const editTaskHandler = async (updatedTask) => {
    try {
      await axios.put(`http://localhost:8000/tasks/${updatedTask.id}`, updatedTask);
      fetchTasks();
    } catch (error) {
      console.error("Error updating task", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="app-container">
      <div className="header">
        <h1>Workload Management</h1>
        {/* Organization dropdown */}
        <div className="org-dropdown">
          <label>Select Organization: </label>
          <select value={selectedOrg || ""} onChange={(e) => setSelectedOrg(e.target.value)}>
            {userOrgs.map(org => (
              <option key={org.id} value={org.id}>{org.name}</option>
            ))}
          </select>
        </div>
        <div className="button-group">
          <button onClick={() => setIsUserModalOpen(true)} className="primary-button">
            Add User
          </button>
          <button onClick={() => setIsTaskModalOpen(true)} className="primary-button">
            Add Task
          </button>
          <button onClick={handleLogout} className="danger-button">
            Logout
          </button>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-button ${activeTab === "gantt" ? "active" : ""}`} onClick={() => setActiveTab("gantt")}>
          Workload View
        </button>
        <button className={`tab-button ${activeTab === "taskGantt" ? "active" : ""}`} onClick={() => setActiveTab("taskGantt")}>
          Task Gantt View
        </button>
        <button className={`tab-button ${activeTab === "list" ? "active" : ""}`} onClick={() => setActiveTab("list")}>
          Task List
        </button>
        <button className={`tab-button ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>
          User List
        </button>
      </div>

      {activeTab === "gantt" && (
         <GanttChartComponent
         users={users}
         tasks={tasks}
         orgMembers={orgMembers}
         viewMode={viewMode}
         startDate={startDate}
         setStartDate={setStartDate}
       />
      )}

      {activeTab === "list" && (
        <TaskListView
        tasks={tasks}
        users={users}
        orgMembers={orgMembers}
        deleteTask={deleteTask}
        editTaskHandler={editTaskHandler}
      />
      )}

      {activeTab === "users" && (
        <UserListView users={users} deleteUser={deleteUser} editUserHandler={editUserHandler} />
      )}

      {activeTab === "taskGantt" && (
        <TaskGanttView tasks={tasks} orgMembers={orgMembers} viewMode={viewMode} startDate={startDate} setStartDate={setStartDate} />
      )}

      {isUserModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add User</h2>
            <input
              type="text"
              placeholder="Name"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            />
            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            />
            <button onClick={addUser} className="success-button">Submit</button>
            <button onClick={() => { setIsUserModalOpen(false); setNewUser({ name: "", email: "" }); }} className="danger-button">Close</button>
          </div>
        </div>
      )}

      {isTaskModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Add Task</h2>
            <input
              type="text"
              placeholder="Task Name"
              value={newTask.name}
              onChange={(e) => setNewTask({ ...newTask, name: e.target.value })}
            />
            <textarea
              placeholder="Description"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            />
            <select
              value={newTask.userId}
              onChange={(e) => setNewTask({ ...newTask, userId: e.target.value })}
            >
              <option value="">Assign To</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name} (ID: {user.id})
                </option>
              ))}
            </select>
            <input
              type="date"
              value={newTask.startDate}
              onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
            />
            <input
              type="date"
              value={newTask.endDate}
              onChange={(e) => setNewTask({ ...newTask, endDate: e.target.value })}
            />
            <button onClick={addTask} className="success-button">Submit</button>
            <button onClick={() => { setIsTaskModalOpen(false); setNewTask({ name: "", userId: "", startDate: "", endDate: "", description: "" }); }} className="danger-button">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
