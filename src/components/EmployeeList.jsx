import React from 'react';

function EmployeeList({ users, onWeeklyHoursChange, onSaveWeeklyHours, onVacationWeeksChange, onVacationDatesChange }) {
  return (
    <div>
      <h3>Benutzer und wöchentliche Arbeitszeiten</h3>
      {users.map(user => (
        <div key={user._id}>
          <span>{user.username}</span>
          <input
            type="number"
            value={user.weeklyHours || ''}
            onChange={(e) => onWeeklyHoursChange(user._id, e.target.value)}
            placeholder="Stunden pro Woche"
          />
          <button onClick={() => onSaveWeeklyHours(user._id, user.weeklyHours)}>Speichern</button>

          <div>
            <label>Urlaubswochen: </label>
            <input
              type="number"
              value={user.vacationWeeks || 5}
              onChange={(e) => onVacationWeeksChange(user._id, e.target.value)}
            />
          </div>

          <div>
            <label>Urlaubstage: </label>
            <input
              type="text"
              value={user.vacationDates.join(', ') || ''}
              onChange={(e) => onVacationDatesChange(user._id, e.target.value.split(',').map(date => date.trim()))}
              placeholder="z. B. 2024-07-15, 2024-08-20"
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default EmployeeList;
