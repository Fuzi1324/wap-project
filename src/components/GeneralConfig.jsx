import React from 'react';

function GeneralConfig({ workStartTime, setWorkStartTime, workEndTime, setWorkEndTime, workDays, setWorkDays }) {
  return (
    <div>
      <h3>Allgemeine Konfiguration</h3>
      <div>
        <label>Arbeitszeit von: </label>
        <input
          type="time"
          value={workStartTime}
          onChange={(e) => setWorkStartTime(e.target.value)}
        />
      </div>
      <div>
        <label>Arbeitszeit bis: </label>
        <input
          type="time"
          value={workEndTime}
          onChange={(e) => setWorkEndTime(e.target.value)}
        />
      </div>
      <div>
        <label>Arbeitstage: </label>
        <select
          multiple
          value={workDays}
          onChange={(e) =>
            setWorkDays(Array.from(e.target.selectedOptions, option => option.value))
          }
        >
          <option value="Monday">Montag</option>
          <option value="Tuesday">Dienstag</option>
          <option value="Wednesday">Mittwoch</option>
          <option value="Thursday">Donnerstag</option>
          <option value="Friday">Freitag</option>
          <option value="Saturday">Samstag</option>
          <option value="Sunday">Sonntag</option>
        </select>
      </div>
    </div>
  );
}

export default GeneralConfig;
