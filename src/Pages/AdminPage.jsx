import { useState, useEffect } from 'react';
import EmployeeList from '../components/EmployeeList';
import GeneralConfig from '../components/GeneralConfig';
import ScheduleDisplay from '../components/ScheduleDisplay';
import Navigation from '../components/Navigation';
import { Layout, Button, Typography, Space, Divider, message, Card } from 'antd';
import './AuthPages.css';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

function AdminPage() {
  const [users, setUsers] = useState([]);
  const [workStartTime, setWorkStartTime] = useState('09:00');
  const [workEndTime, setWorkEndTime] = useState('17:00');
  const [workDays, setWorkDays] = useState(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']);
  const [schedules, setSchedules] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [organisationId, setOrganizationId] = useState(null);

  const navigate = useNavigate();

  const fetchIfLoggedIn = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        message.error('Not logged in');
        navigate('/login');
        return;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Error fetching data');
    }
  };

  const fetchIfUserIsAdmin = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        message.error('Not logged in');
        navigate('/login');
        return;
      }
      const res = await fetch('/api/user/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      const data = await res.json();
      if (data.role !== 'admin') {
        message.error('You are not an admin');
        navigate('/');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Error fetching data');
    }
  };

  const fetchUsers = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        message.error('Not logged in');
        navigate('/login');
        return;
      }
      
      const res = await fetch('/api/organization/users', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
  
      if (!res.ok) {
        if (res.status === 404) {
          message.error('Keine Organisation gefunden');
        } else {
          message.error('Fehler beim Laden der Mitarbeiterdaten');
        }
        return;
      }
  
      const data = await res.json();
      setOrganizationId(data._id);
      const usersWithDefaults = data.map((user) => ({
        ...user,
        weeklyHours: user.weeklyHours || '',
        vacationDays: user.vacationDays || 25,
      }));
      
      setUsers(usersWithDefaults);
    } catch (error) {
      console.error('Error fetching users:', error);
      message.error('Fehler beim Laden der Mitarbeiterdaten');
    }
  };

  const loadOrganizationAndSchedules = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        message.error('Not logged in');
        navigate('/login');
        return;
      }
  
      const orgResponse = await fetch('/api/user/organization', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      if (!orgResponse.ok) {
        throw new Error('Fehler beim Laden der Organisation');
      }
      
      const orgData = await orgResponse.json();
      
      if (!orgData._id) {
        throw new Error('Keine Organizations-ID gefunden');
      }
  
      const schedulesResponse = await fetch(`/api/organization/${orgData._id}/schedules`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
  
      if (!schedulesResponse.ok) {
        throw new Error('Fehler beim Laden der Schedules');
      }
  
      const schedulesData = await schedulesResponse.json();
      setSchedules(schedulesData);
  
    } catch (error) {
      console.error('Error:', error);
      message.error(error.message);
    }
  };

    useEffect(() => {
    fetchIfLoggedIn();
    fetchIfUserIsAdmin();
    fetchUsers();
    loadOrganizationAndSchedules();
  }, [navigate]);


  const handleWeeklyHoursChange = (userId, weeklyHours) => {
    setUsers(users.map(user => user._id === userId ? { ...user, weeklyHours: parseInt(weeklyHours, 10) } : user));
  };

  const handleSaveWeeklyHours = async (userId, weeklyHours) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        message.error('Not logged in');
        navigate('/login');
        return;
      }
      const response = await fetch(`/api/user/${userId}/weeklyHours`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ weeklyHours: Number(weeklyHours) })
      });

      if (!response.ok) {
        throw new Error('Failed to update weekly hours');
      }

      console.log(`Weekly hours for user ${userId} updated successfully.`);
      message.success('Weekly hours updated successfully');
    } catch (error) {
      console.error('Error updating weekly hours:', error);
      message.error('Failed to update weekly hours: ' + error.message);
    }
  };

  const handleVacationDaysChange = (userId, value) => {
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user._id === userId ? { ...user, vacationDays: value } : user
      )
    );
  };

  const handleSaveVacationDays = async (userId, value) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        message.error('Not logged in');
        navigate('/login');
        return;
      }

      const response = await fetch(`/api/user/${userId}/vacation-days`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify({ vacationDays: value })
      });

      if (!response.ok) {
        throw new Error('Failed to update vacation days');
      }

      message.success('Urlaubstage erfolgreich aktualisiert');
    } catch (error) {
      console.error('Error updating vacation days:', error);
      message.error('Fehler beim Aktualisieren der Urlaubstage');
    }
  };

  const handleVacationWeeksChange = (userId, vacationWeeks) => {
    setUsers(users.map(user => user._id === userId ? { ...user, vacationWeeks: parseInt(vacationWeeks, 10) } : user));
  };

  const handleSaveVacationWeeks = async (userId, vacationWeeks) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        message.error('Not logged in');
        navigate('/login');
        return;
      }
      const response = await fetch(`/api/user/${userId}/vacation-weeks`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vacationWeeks: Number(vacationWeeks) })
      });

      if (!response.ok) {
        throw new Error('Failed to update vacation weeks');
      }

      message.success('Vacation weeks updated successfully');
    } catch (error) {
      console.error('Error updating vacation weeks:', error);
      message.error('Failed to update vacation weeks: ' + error.message);
    }
  };

  const handleVacationDatesChange = (userId, vacationDates) => {
    setUsers(users.map(user => user._id === userId ? { ...user, vacationDates } : user));
  };

  const handleSaveVacationDates = async (userId, vacationDates) => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        message.error('Not logged in');
        navigate('/login');
        return;
      }
      const response = await fetch(`/api/user/${userId}/vacation-dates`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vacationDates })
      });

      if (!response.ok) {
        throw new Error('Failed to update vacation dates');
      }

      message.success('Vacation dates updated successfully');
    } catch (error) {
      console.error('Error updating vacation dates:', error);
      message.error('Failed to update vacation dates: ' + error.message);
    }
  };

  const handleGenerateSchedule = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (!accessToken) {
        message.error('Not logged in');
        navigate('/login');
        return;
      }

      const currentMonth = new Date().toISOString().slice(0, 7); // Format: YYYY-MM
      
      const response = await fetch('/api/generate-schedule', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          month: currentMonth,
          users: users.map(user => ({
            ...user,
            weeklyHours: parseInt(user.weeklyHours) || 40,
            vacationDates: user.vacationDates || []
          }))
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `HTTP error! status: ${response.status}`);
      }

      message.success('Dienstplan erfolgreich generiert');
      await loadOrganizationAndSchedules();
    } catch (error) {
      console.error('Error generating schedule:', error);
      message.error('Failed to generate schedule: ' + error.message);
    }
  };

  const handleScheduleSelect = (scheduleId) => {
    const schedule = schedules.find(s => s._id === scheduleId);
    setSelectedSchedule(schedule);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Navigation />
      <Layout.Content className='auth-form'>
        <Card>
          <Title level={2}>Admin-Konfiguration</Title>

          <EmployeeList
            users={users}
            onWeeklyHoursChange={handleWeeklyHoursChange}
            onSaveWeeklyHours={handleSaveWeeklyHours}
            onVacationDaysChange={handleVacationDaysChange}
            onSaveVacationDays={handleSaveVacationDays}
            onVacationWeeksChange={handleVacationWeeksChange}
            onSaveVacationWeeks={handleSaveVacationWeeks}
            onVacationDatesChange={handleVacationDatesChange}
            onSaveVacationDates={handleSaveVacationDates}
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