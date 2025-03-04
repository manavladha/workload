import React, { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const GanttChartComponent = ({ users, tasks, orgMembers, viewMode, startDate, setStartDate }) => {
  const [currentView, setCurrentView] = useState(viewMode);

  useEffect(() => {
    setCurrentView(viewMode);
  }, [viewMode]);

  useEffect(() => {
    console.log("GanttChartComponent - Users:", users);
    console.log("GanttChartComponent - OrgMembers:", orgMembers);
    console.log("GanttChartComponent - Tasks:", tasks);
  }, [users, orgMembers, tasks]);

  const getDatesForView = () => {
    let dates = [];
    let current = new Date(startDate);
    if (currentView === "month") {
      current.setDate(1);
    }
    let days = currentView === "week" 
      ? 7 
      : new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
    for (let i = 0; i < days; i++) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const handlePrev = () => {
    let newStart = new Date(startDate);
    if (currentView === "week") {
      newStart.setDate(newStart.getDate() - 7);
    } else {
      newStart.setMonth(newStart.getMonth() - 1);
      newStart.setDate(1);
    }
    setStartDate(newStart);
  };

  const handleNext = () => {
    let newStart = new Date(startDate);
    if (currentView === "week") {
      newStart.setDate(newStart.getDate() + 7);
    } else {
      newStart.setMonth(newStart.getMonth() + 1);
      newStart.setDate(1);
    }
    setStartDate(newStart);
  };

  const getTaskStyle = (task) => {
    const dates = getDatesForView();
    const taskStart = new Date(task.start_date);
    const taskEnd = new Date(task.end_date);
    if (taskEnd < dates[0] || taskStart > dates[dates.length - 1]) return { display: "none" };

    const startIndexWithinView = dates.findIndex(date => date >= taskStart);
    const endIndexWithinView = dates.findIndex(date => date > taskEnd);
    const adjustedStartIndex = Math.max(startIndexWithinView, 0);
    const taskDuration = endIndexWithinView !== -1 
      ? Math.max(1, endIndexWithinView - adjustedStartIndex)
      : Math.max(1, Math.ceil((taskEnd - taskStart) / (1000 * 60 * 60 * 24)) + 1);

    return {
      gridColumn: `${adjustedStartIndex + 2} / span ${taskDuration}`,
      backgroundColor: "#F4F4F4",
      color: "black",
      border: "1px solid #DFDFDF",
      padding: "5px",
      borderRadius: "6px",
      fontSize: "14px",
      fontWeight: "bold",
      textAlign: "start",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      marginBottom: "5px",
    };
  };

  const getFormattedMonth = () => {
    return new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(startDate);
  };

  return (
    <div className="gantt-container">
      <div className="gantt-header-container">
        <div className="gantt-navigation">
          <FaChevronLeft size={16} className="nav-icon" onClick={handlePrev} />
          <h4>{currentView === "week" ? "Week View" : "Month View"}</h4>
          <FaChevronRight size={15} className="nav-icon" onClick={handleNext} />
        </div>
        <span className="month-label">{getFormattedMonth()}</span>
        <select className="view-selector" value={currentView} onChange={(e) => setCurrentView(e.target.value)}>
          <option value="week">Week View</option>
          <option value="month">Month View</option>
        </select>
      </div>

      <div className="gantt-table">
        <div className="gantt-header" style={{ display: "grid", gridTemplateColumns: `150px repeat(${getDatesForView().length}, 1fr)` }}>
          <div className="gantt-user-column">Users</div>
          {getDatesForView().map((date, index) => (
            <div key={index} className="gantt-date">
              {currentView === "week" 
                ? `${date.toLocaleString("en-US", { weekday: "short" })} ${date.getDate()}`
                : date.getDate()}
            </div>
          ))}
        </div>

        {users.map((user) => {
          const member = orgMembers.find((m) => Number(m.userId) === Number(user.id));
          const userTasks = member 
            ? tasks.filter((t) => Number(t.org_member_id) === Number(member.id))
            : [];
          return (
            <div
              key={user.id}
              className="gantt-row"
              style={{
                display: "grid",
                gridTemplateColumns: `150px repeat(${getDatesForView().length}, 1fr)`,
                borderBottom: "1px solid #ddd",
                position: "relative",
              }}
            >
              <div className="gantt-user-cell">{user.name}</div>
              {userTasks.map((task) => (
                <div key={task.id} style={getTaskStyle(task)}>
                  {task.name}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GanttChartComponent;
