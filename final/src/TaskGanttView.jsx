// TaskGanttView.jsx
import React, { useState, useEffect } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

const TaskGanttView = ({ tasks, startDate, setStartDate }) => {
  // Force the view to be "month"
  const [currentView, setCurrentView] = useState("month");

  useEffect(() => {
    setCurrentView("month");
  }, []);

  // Always generate dates for the month view.
  const getDatesForView = () => {
    let dates = [];
    let current = new Date(startDate);
    current.setDate(1); // Always start at the first of the month.
    let days = new Date(current.getFullYear(), current.getMonth() + 1, 0).getDate();
    for (let i = 0; i < days; i++) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  // Navigation: Shift the month
  const handlePrev = () => {
    let newStart = new Date(startDate);
    newStart.setMonth(newStart.getMonth() - 1);
    newStart.setDate(1);
    setStartDate(newStart);
  };

  const handleNext = () => {
    let newStart = new Date(startDate);
    newStart.setMonth(newStart.getMonth() + 1);
    newStart.setDate(1);
    setStartDate(newStart);
  };

  // Calculate task style based on its date range
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
      backgroundColor: "#007bff",
      color: "white",
      border: "1px solid #DFDFDF",
      padding: "4px",
      borderRadius: "100px",
      fontSize: "14px",
      fontWeight: "bold",
      textAlign: "start",
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
      marginBottom: "5px",
      paddingLeft: "12px",
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
          <h4>Month View</h4>
          <FaChevronRight size={15} className="nav-icon" onClick={handleNext} />
        </div>
        <span className="month-label">{getFormattedMonth()}</span>
        {/* The view selector is removed since only Month View is available */}
      </div>

      <div className="gantt-table">
        <div className="gantt-header" style={{ display: "grid", gridTemplateColumns: `150px repeat(${getDatesForView().length}, 1fr)` }}>
          <div className="gantt-task-column">Tasks</div>
          {getDatesForView().map((date, index) => (
            <div key={index} className="gantt-date">
              {date.getDate()}
            </div>
          ))}
        </div>

        {tasks.map(task => (
          <div key={task.id} className="gantt-row" style={{ display: "grid", gridTemplateColumns: `150px repeat(${getDatesForView().length}, 1fr)`, borderBottom: "1px solid #ddd", position: "relative" }}>
            <div className="gantt-task-cell">{task.name}</div>
            <div style={getTaskStyle(task)}>{task.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskGanttView;
