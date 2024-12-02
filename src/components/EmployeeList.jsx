import React, { useState } from 'react';
import { List, Input, DatePicker, Button, Space } from 'antd';
import dayjs from 'dayjs';

const EmployeeList = ({ 
  users, 
  onWeeklyHoursChange, 
  onSaveWeeklyHours,
  onVacationWeeksChange,
  onSaveVacationWeeks,
  onVacationDatesChange,
  onSaveVacationDates 
}) => {
  const [changedFields, setChangedFields] = useState({});

  const handleWeeklyHoursChange = (userId, value) => {
    onWeeklyHoursChange(userId, value);
    setChangedFields(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        weeklyHours: true
      }
    }));
  };

  const handleVacationWeeksChange = (userId, value) => {
    onVacationWeeksChange(userId, value);
    setChangedFields(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        vacationWeeks: true
      }
    }));
  };

  const handleVacationDatesChange = (userId, dates) => {
    onVacationDatesChange(userId, dates);
    setChangedFields(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        vacationDates: true
      }
    }));
  };

  const handleSaveAllChanges = async () => {
    for (const user of users) {
      const userChanges = changedFields[user._id] || {};
      
      if (userChanges.weeklyHours) {
        await onSaveWeeklyHours(user._id, user.weeklyHours);
      }
      
      if (userChanges.vacationWeeks) {
        await onSaveVacationWeeks(user._id, user.vacationWeeks);
      }
      
      if (userChanges.vacationDates) {
        await onSaveVacationDates(user._id, user.vacationDates);
      }
    }
    setChangedFields({});
  };

  const hasAnyChanges = Object.keys(changedFields).length > 0;

  return (
    <div>
      <List
        itemLayout="vertical"
        dataSource={users}
        renderItem={user => (
          <List.Item key={user._id}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <strong>Name:</strong> {user.first_name} {user.last_name}
              </div>
              <div>
                <strong>Wochenstunden:</strong>
                <Input
                  type="number"
                  value={user.weeklyHours || ''}
                  onChange={(e) => handleWeeklyHoursChange(user._id, e.target.value)}
                  style={{ width: 100, marginLeft: 8 }}
                />
              </div>
              <div>
                <strong>Urlaubswochen:</strong>
                <Input
                  type="number"
                  value={user.vacationWeeks || 5}
                  onChange={(e) => handleVacationWeeksChange(user._id, e.target.value)}
                  style={{ width: 100, marginLeft: 8 }}
                />
              </div>
              <div>
                <strong>Urlaubstage:</strong>
                {user.vacationPeriods && user.vacationPeriods.length > 0 ? (
                  <List
                    size="small"
                    dataSource={user.vacationPeriods.sort((a, b) => 
                      dayjs(a.startDate).valueOf() - dayjs(b.startDate).valueOf()
                    )}
                    renderItem={(period) => (
                      <List.Item>
                        {dayjs(period.startDate).format('DD.MM.YYYY')} - {dayjs(period.endDate).format('DD.MM.YYYY')}
                        {period.startDate === period.endDate ? ' (1 Tag)' : 
                         ` (${dayjs(period.endDate).diff(dayjs(period.startDate), 'days') + 1} Tage)`}
                      </List.Item>
                    )}
                  />
                ) : (
                  <span style={{ marginLeft: 8 }}>Keine Urlaubstage eingetragen</span>
                )}
              </div>
            </Space>
          </List.Item>
        )}
      />
      <Button 
        type="primary" 
        onClick={handleSaveAllChanges}
        disabled={!hasAnyChanges}
        style={{ marginTop: 16 }}
      >
        Alle Änderungen speichern
      </Button>
    </div>
  );
};

export default EmployeeList;