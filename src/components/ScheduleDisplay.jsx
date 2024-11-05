import React from 'react';

function ScheduleDisplay({ schedules, selectedSchedule, onScheduleSelect }) {
  return (
    <div>
      <h3>Generierter Dienstplan</h3>

      <label>Wähle einen Dienstplan: </label>
      <select 
        onChange={(e) => onScheduleSelect(e.target.value)} 
        value={selectedSchedule ? selectedSchedule._id : ''}
      >
        {schedules.map(schedule => (
          <option key={schedule._id} value={schedule._id}>
            {new Date(schedule.generatedAt).toLocaleString()}
          </option>
        ))}
      </select>

      {selectedSchedule && (
        <ul>
          {selectedSchedule.schedule.map((userSchedule, index) => (
            <li key={index}>
              <strong>{userSchedule.user}</strong>
              <ul>
                {userSchedule.schedule.map((day, idx) => (
                  <li key={idx}>
                    {day.day}: {day.start} - {day.end} ({day.hours} Stunden)
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default ScheduleDisplay;