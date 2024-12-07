import React from 'react';
import { List, Input, Space } from 'antd';
import dayjs from 'dayjs';

const EmployeeList = ({ 
  users, 
  onWeeklyHoursChange, 
  onSaveWeeklyHours,
  onVacationDaysChange,
  onSaveVacationDays,
  onVacationDatesChange,
  onSaveVacationDates 
}) => {
  const handleWeeklyHoursChange = async (userId, value) => {
    // Aktualisiere die UI
    onWeeklyHoursChange(userId, value);
    // Speichere sofort in der Datenbank
    await onSaveWeeklyHours(userId, value);
  };

  const handleVacationDaysChange = async (userId, value) => {
    // Aktualisiere die UI
    onVacationDaysChange(userId, value);
    // Speichere sofort in der Datenbank
    await onSaveVacationDays(userId, value);
  };

  const handleVacationDatesChange = async (userId, dates) => {
    // Aktualisiere die UI
    onVacationDatesChange(userId, dates);
    // Speichere sofort in der Datenbank
    await onSaveVacationDates(userId, dates);
  };

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
                <strong>Urlaubstage:</strong>
                <Input
                  type="number"
                  value={user.vacationDays || 25}
                  onChange={(e) => handleVacationDaysChange(user._id, e.target.value)}
                  style={{ width: 100, marginLeft: 8 }}
                />
              </div>
              <div>
                <strong>Geplante Urlaubstage:</strong>
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
    </div>
  );
};

export default EmployeeList;