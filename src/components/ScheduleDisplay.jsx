import React, { useState, useEffect } from 'react';
import { Table, Calendar, Select, Radio, Card, Typography, Tag, Tooltip } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/de';
import localeData from 'dayjs/plugin/localeData';
import updateLocale from 'dayjs/plugin/updateLocale';

const { Option } = Select;
const { Title } = Typography;

// Konfiguriere dayjs
dayjs.extend(localeData);
dayjs.extend(updateLocale);
dayjs.locale('de');

// Aktualisiere die deutsche Lokalisierung
dayjs.updateLocale('de', {
  weekStart: 1, // Montag als erster Tag
  weekdays: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
  weekdaysShort: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
  weekdaysMin: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
  months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  monthsShort: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
});

function ScheduleDisplay({ schedules, selectedSchedule, onScheduleSelect }) {
  const [viewMode, setViewMode] = useState('table');
  const [selectedUser, setSelectedUser] = useState(null);

  // Setze den ersten Benutzer als Standard für die Kalenderansicht
  useEffect(() => {
    if (selectedSchedule && selectedSchedule.schedule.length > 0 && !selectedUser) {
      setSelectedUser(selectedSchedule.schedule[0].userId);
    }
  }, [selectedSchedule]);

  if (!selectedSchedule) {
    return (
      <div>
        <Title level={3}>Generierter Dienstplan</Title>
        <Select
          style={{ width: 300 }}
          placeholder="Wähle einen Dienstplan"
          onChange={onScheduleSelect}
        >
          {schedules.map(schedule => (
            <Option key={schedule._id} value={schedule._id}>
              Generiert am: {dayjs(schedule.generatedAt).format('DD.MM.YYYY HH:mm')}
            </Option>
          ))}
        </Select>
      </div>
    );
  }

  // Erstelle Spalten für die Tabelle
  const columns = [
    {
      title: 'Mitarbeiter',
      dataIndex: 'username',
      key: 'username',
      fixed: 'left',
      width: 150,
    },
    {
      title: 'Wochenstunden',
      dataIndex: 'weeklyHours',
      key: 'weeklyHours',
      width: 120,
    },
    ...selectedSchedule.schedule[0].schedule.map((_, index) => {
      const date = dayjs(selectedSchedule.schedule[0].schedule[index].date);
      return {
        title: date.format('DD.MM (dd)'),
        dataIndex: ['schedule', index],
        key: date.format('YYYY-MM-DD'),
        width: 120,
        render: (day) => {
          if (!day.isWorkDay) {
            return day.isVacationDay ? (
              <Tag color="orange">Urlaub</Tag>
            ) : (
              <Tag color="default">-</Tag>
            );
          }
          return (
            <Tooltip title={`${day.hours.toFixed(1)} Stunden`}>
              <span>{day.start} - {day.end}</span>
            </Tooltip>
          );
        }
      };
    })
  ];

  // Erstelle Daten für die Tabelle
  const tableData = selectedSchedule.schedule.map((userSchedule) => ({
    key: userSchedule.userId,
    username: userSchedule.username,
    weeklyHours: userSchedule.weeklyHours,
    schedule: userSchedule.schedule
  }));

  // Kalender-Render-Funktion
  const dateCellRender = (date) => {
    const dateStr = date.format('YYYY-MM-DD');
    const scheduleData = selectedSchedule.schedule
      .filter(user => selectedUser === 'all' || user.userId === selectedUser)
      .map(user => {
        const daySchedule = user.schedule.find(day => day.date === dateStr);
        if (!daySchedule) return null;
        return {
          username: user.username,
          schedule: daySchedule
        };
      })
      .filter(Boolean);

    if (scheduleData.length === 0) return null;

    return (
      <div style={{ fontSize: '0.8em' }}>
        {scheduleData.map((data, index) => (
          <div key={index}>
            {data.schedule.isWorkDay ? (
              <Tag color="processing">
                {data.schedule.start} - {data.schedule.end}
              </Tag>
            ) : data.schedule.isVacationDay ? (
              <Tag color="orange">Urlaub</Tag>
            ) : (
              <Tag color="default">-</Tag>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Select
          style={{ width: 300, marginRight: 16 }}
          value={selectedSchedule._id}
          onChange={onScheduleSelect}
          placeholder="Wähle einen generierten Dienstplan"
        >
          {schedules.map(schedule => (
            <Option key={schedule._id} value={schedule._id}>
              Generiert am: {dayjs(schedule.generatedAt).format('DD.MM.YYYY HH:mm')} für {dayjs(schedule.month).format('MMMM YYYY')}
            </Option>
          ))}
        </Select>

        <Radio.Group
          value={viewMode}
          onChange={(e) => setViewMode(e.target.value)}
          style={{ marginRight: 16 }}
        >
          <Radio.Button value="table">Tabelle</Radio.Button>
          <Radio.Button value="calendar">Kalender</Radio.Button>
        </Radio.Group>

        {viewMode === 'calendar' && (
          <Select
            showSearch
            style={{ width: 200 }}
            value={selectedUser}
            onChange={setSelectedUser}
            placeholder="Mitarbeiter filtern"
            optionFilterProp="children"
            filterOption={(input, option) =>
              option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
            }
          >
            {selectedSchedule.schedule.map(user => (
              <Option key={user.userId} value={user.userId}>{user.username}</Option>
            ))}
          </Select>
        )}
      </div>

      {viewMode === 'table' ? (
        <Table
          columns={columns}
          dataSource={tableData}
          scroll={{ x: 'max-content' }}
          pagination={false}
        />
      ) : (
        <Calendar 
          dateCellRender={dateCellRender}
          locale={{
            lang: {
              locale: 'de_DE',
              monthSelect: 'Monat auswählen',
              yearSelect: 'Jahr auswählen',
              today: 'Heute',
              now: 'Jetzt',
              backToToday: 'Zurück zu Heute',
              ok: 'OK',
              timeSelect: 'Zeit auswählen',
              dateSelect: 'Datum auswählen',
              weekSelect: 'Woche auswählen',
              clear: 'Zurücksetzen',
              previousMonth: 'Vorheriger Monat',
              nextMonth: 'Nächster Monat',
              monthBeforeYear: false,
              previousYear: 'Vorheriges Jahr',
              nextYear: 'Nächstes Jahr',
              previousDecade: 'Vorheriges Jahrzehnt',
              nextDecade: 'Nächstes Jahrzehnt',
              previousCentury: 'Vorheriges Jahrhundert',
              nextCentury: 'Nächstes Jahrhundert'
            },
            timePickerLocale: {
              placeholder: 'Zeit auswählen'
            }
          }}
        />
      )}
    </div>
  );
}

export default ScheduleDisplay;