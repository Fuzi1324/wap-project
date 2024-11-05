import React, { useState, useEffect } from 'react';

function AdminPage() {
  const [users, setUsers] = useState([]);
  const [workStartTime, setWorkStartTime] = useState('09:00');
  const [workEndTime, setWorkEndTime] = useState('17:00');
  const [workDays, setWorkDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [schedule, setSchedule] = useState([]);

  useEffect(() => {
    fetch('/api/user', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    })
      .then((res) => res.json())
      .then((data) => {
        const usersWithHours = data.map((user) => ({
          ...user,
          weeklyHours: user.weeklyHours || '', // Zeige das Feld zur Eingabe, wenn `weeklyHours` leer ist
        }));
        setUsers(usersWithHours);
      });
  }, []);

  const handleWeeklyHoursChange = (userId, weeklyHours) => {
    setUsers(users.map(user => user._id === userId ? { ...user, weeklyHours: parseInt(weeklyHours, 10) } : user));
  };

  const saveWeeklyHours = async (userId, weeklyHours) => {
    try {
      await fetch(`/api/user/${userId}/weeklyHours`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weeklyHours })
      });
      console.log(`Weekly hours for user ${userId} updated successfully.`);
    } catch (error) {
      console.error('Error updating weekly hours:', error);
    }
  };

  const handleGenerateSchedule = async () => {
    try {
      const response = await fetch('/api/generate-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workStartTime, workEndTime, workDays, users })
      });
      const data = await response.json();
      setSchedule(data.schedule);
    } catch (error) {
      console.error('Fehler beim Generieren des Dienstplans:', error);
    }
  };

  return (
    <div>
      <h2>Admin-Konfiguration</h2>

      <h3>Benutzer und wöchentliche Arbeitszeiten</h3>
      {users.map((user) => (
        <div key={user._id}>
          <span>{user.username}</span>
          <input
            type="number"
            value={user.weeklyHours}
            onChange={(e) => handleWeeklyHoursChange(user._id, e.target.value)}
            placeholder="Stunden pro Woche"
          />
          <button onClick={() => saveWeeklyHours(user._id, user.weeklyHours)}>Speichern</button>
        </div>
      ))}

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
      <button onClick={handleGenerateSchedule}>Dienstplan generieren</button>

      {schedule.length > 0 && (
        <div>
          <h3>Generierter Dienstplan</h3>
          <ul>
            {schedule.map((userSchedule, index) => (
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
        </div>
      )}
    </div>
  );
}

export default AdminPage;
