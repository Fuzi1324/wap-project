import React, { useState, useEffect } from 'react';
import EmployeeList from '../components/EmployeeList';
import GeneralConfig from '../components/GeneralConfig';
import ScheduleDisplay from '../components/ScheduleDisplay';
import Navigation from '../components/Navigation';
import { Layout, Button, Typography, Space, Divider, Row, Col, message, Card } from 'antd';

const { Title } = Typography;
function AdminPage() {
  const [users, setUsers] = useState([]);
  const [workStartTime, setWorkStartTime] = useState('09:00');
  const [workEndTime, setWorkEndTime] = useState('17:00');
  const [workDays, setWorkDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  useEffect(() => {
    fetchUsers();
    fetchSchedules();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/user');
      const data = await res.json();
      const usersWithHours = data.map((user) => ({
        ...user,
        weeklyHours: user.weeklyHours || '',
        vacationWeeks: user.vacationWeeks || 5,
        vacationDates: user.vacationDates || [],
      }));
      setUsers(usersWithHours);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await fetch('/api/all-schedules');
      const data = await res.json();
      setSchedules(data);
      if (data.length > 0) {
        setSelectedSchedule(data[0]);
        const latestSchedule = data[0];
        setWorkStartTime(latestSchedule.workStartTime || '09:00');
        setWorkEndTime(latestSchedule.workEndTime || '17:00');
        setWorkDays(latestSchedule.workDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
    }
  };

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

  const handleVacationWeeksChange = (userId, vacationWeeks) => {
    setUsers(users.map(user => user._id === userId ? { ...user, vacationWeeks: parseInt(vacationWeeks, 10) } : user));
  };

  const saveVacationWeeks = async (userId, vacationWeeks) => {
    try {
      await fetch(`/api/user/${userId}/vacation-weeks`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vacationWeeks })
      });
      console.log(`Vacation weeks for user ${userId} updated successfully.`);
    } catch (error) {
      console.error('Error updating vacation weeks:', error);
    }
  };

  const handleVacationDatesChange = (userId, vacationDates) => {
    setUsers(users.map(user => user._id === userId ? { ...user, vacationDates } : user));
  };

  const saveVacationDates = async (userId, vacationDates) => {
    try {
      await fetch(`/api/user/${userId}/vacation-dates`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vacationDates })
      });
      console.log(`Vacation dates for user ${userId} updated successfully.`);
    } catch (error) {
      console.error('Error updating vacation dates:', error);
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
      await fetchSchedules();
    } catch (error) {
      console.error('Error generating schedule:', error);
    }
  };

  const handleScheduleSelect = (scheduleId) => {
    const schedule = schedules.find(s => s._id === scheduleId);
    setSelectedSchedule(schedule);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Navigation />
      <Layout.Content style={{ padding: '20px' }}>
        <Card>
          <Title level={2}>Admin-Konfiguration</Title>

          <EmployeeList 
            users={users} 
            onWeeklyHoursChange={handleWeeklyHoursChange}
            onSaveWeeklyHours={saveWeeklyHours} 
            onVacationWeeksChange={handleVacationWeeksChange}
            onSaveVacationWeeks={saveVacationWeeks}
            onVacationDatesChange={handleVacationDatesChange}
            onSaveVacationDates={saveVacationDates}
          />

          <Divider />

          <GeneralConfig
            workStartTime={workStartTime}
            setWorkStartTime={setWorkStartTime}
            workEndTime={workEndTime}
            setWorkEndTime={setWorkEndTime}
            workDays={workDays}
            setWorkDays={setWorkDays}
          />

          <Space style={{ margin: '20px 0' }}>
            <Button type="primary" onClick={handleGenerateSchedule}>
              Dienstplan generieren
            </Button>
          </Space>

          <Divider />

          <ScheduleDisplay 
            schedules={schedules}
            selectedSchedule={selectedSchedule}
            onScheduleSelect={handleScheduleSelect}
          />
        </Card>
      </Layout.Content>
    </Layout>
  );
}

export default AdminPage;