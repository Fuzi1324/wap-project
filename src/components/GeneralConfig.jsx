import React, { useState, useEffect } from 'react';
import { Calendar, TimePicker, Select, Divider, message, Tag } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/de';
import localeData from 'dayjs/plugin/localeData';
import updateLocale from 'dayjs/plugin/updateLocale';

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

const { Option } = Select;

function GeneralConfig({ workStartTime, setWorkStartTime, workEndTime, setWorkEndTime, workDays, setWorkDays }) {
  const [selectedDates, setSelectedDates] = useState(new Map());
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Konvertiere die String-Zeiten in dayjs-Objekte für die TimePicker
  const defaultStartTime = dayjs(workStartTime, 'HH:mm');
  const defaultEndTime = dayjs(workEndTime, 'HH:mm');

  // Aktualisiere die Standardzeiten im Kalender wenn sie sich ändern
  useEffect(() => {
    if (!isInitialLoad) {
      const updatedDates = new Map(selectedDates);
      
      // Aktualisiere nur die als Standard markierten Tage
      updatedDates.forEach((value, key) => {
        if (value.isDefault) {
          const date = dayjs(key);
          const englishDayName = date.locale('en').format('dddd');
          updatedDates.set(key, {
            start: defaultStartTime,
            end: defaultEndTime,
            isDefault: true,
            isWorkDay: workDays.includes(englishDayName)
          });
        }
      });
      
      setSelectedDates(updatedDates);
      saveScheduleToDatabase(updatedDates);
    }
  }, [workStartTime, workEndTime, workDays]);

  // Lade existierende Konfiguration für den aktuellen Monat
  useEffect(() => {
    const fetchExistingSchedule = async () => {
      try {
        const response = await fetch(`/api/work-schedule/${currentMonth.format('YYYY-MM')}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data && data.schedule) {
            const newSelectedDates = new Map();
            data.schedule.forEach(day => {
              newSelectedDates.set(day.date, {
                start: dayjs(day.startTime, 'HH:mm'),
                end: dayjs(day.endTime, 'HH:mm'),
                isDefault: day.isDefault,
                isWorkDay: day.isWorkDay
              });
            });
            setSelectedDates(newSelectedDates);
          } else {
            // Nur wenn keine Daten existieren, initialisiere mit Standardwerten
            initializeMonthWithDefaults();
          }
        }
      } catch (error) {
        console.error('Error fetching existing schedule:', error);
        message.error('Fehler beim Laden des Arbeitsplans');
      } finally {
        setIsInitialLoad(false);
      }
    };

    fetchExistingSchedule();
  }, [currentMonth]);

  const initializeMonthWithDefaults = () => {
    const newSelectedDates = new Map();
    const startDate = currentMonth.startOf('month');
    
    for (let i = 0; i < currentMonth.daysInMonth(); i++) {
      const date = startDate.clone().add(i, 'day');
      const dateKey = date.format('YYYY-MM-DD');
      const englishDayName = date.locale('en').format('dddd');
      
      newSelectedDates.set(dateKey, {
        start: defaultStartTime,
        end: defaultEndTime,
        isDefault: true,
        isWorkDay: workDays.includes(englishDayName)
      });
    }
    
    setSelectedDates(newSelectedDates);
    if (!isInitialLoad) {
      saveScheduleToDatabase(newSelectedDates);
    }
  };

  // Neue Funktion zum Speichern des Schedules
  const saveScheduleToDatabase = async (scheduleData) => {
    try {
      const scheduleToSave = Array.from(scheduleData.entries()).map(([date, times]) => ({
        date,
        startTime: times.start.format('HH:mm'),
        endTime: times.end.format('HH:mm'),
        isDefault: times.isDefault,
        isWorkDay: times.isWorkDay
      }));

      const response = await fetch('/api/work-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          month: currentMonth.format('YYYY-MM'),
          schedule: scheduleToSave,
          defaultConfig: {
            workDays,
            workStartTime,
            workEndTime
          }
        })
      });

      if (response.ok) {
        // Zeige die Erfolgsmeldung nur bei nicht-Standard Änderungen
        if (!isInitialLoad && scheduleToSave.some(day => !day.isDefault)) {
          message.success('Arbeitsplan wurde aktualisiert');
        }
      } else {
        message.error('Fehler beim Speichern des Arbeitsplans');
      }
    } catch (error) {
      console.error('Error saving work schedule:', error);
      message.error('Fehler beim Speichern des Arbeitsplans');
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    const dateKey = date.format('YYYY-MM-DD');
    const dayName = date.locale('en').format('dddd');
    const isDefaultWorkDay = workDays.includes(dayName);
    
    const newDates = new Map(selectedDates);
    const currentSettings = selectedDates.get(dateKey) || {
      start: defaultStartTime,
      end: defaultEndTime,
      isDefault: isDefaultWorkDay,
      isWorkDay: isDefaultWorkDay
    };

    // Wenn der Tag manuell geändert wird, setze isDefault auf false
    newDates.set(dateKey, {
      ...currentSettings,
      isWorkDay: !currentSettings.isWorkDay,
      isDefault: false, // Markiere als nicht-Standard, wenn manuell geändert
      // Behalte die Start- und Endzeiten bei
      start: currentSettings.start,
      end: currentSettings.end
    });

    setSelectedDates(newDates);
    saveScheduleToDatabase(newDates);
  };

  // Neue Hilfsfunktion zum Überprüfen, ob ein Tag von den Standardeinstellungen abweicht
  const isDayModified = (dateKey, settings) => {
    const dayName = dayjs(dateKey).locale('en').format('dddd');
    const isDefaultWorkDay = workDays.includes(dayName);
    
    return (
      !settings.isDefault || // Wenn explizit als nicht-Standard markiert
      settings.isWorkDay !== isDefaultWorkDay || // Wenn der Arbeitstag-Status anders ist als Standard
      (settings.isWorkDay && ( // Wenn es ein Arbeitstag ist und die Zeiten anders sind
        !settings.start.isSame(defaultStartTime, 'minute') ||
        !settings.end.isSame(defaultEndTime, 'minute')
      ))
    );
  };

  const handleTimeChange = (times) => {
    if (!selectedDate || !times) return;
    
    const dateKey = selectedDate.format('YYYY-MM-DD');
    const currentSettings = selectedDates.get(dateKey);
    
    const newDates = new Map(selectedDates);
    newDates.set(dateKey, {
      ...currentSettings,
      start: times[0],
      end: times[1],
      isDefault: false,
      isWorkDay: true
    });
    setSelectedDates(newDates);
    // Speichere die Änderungen sofort
    saveScheduleToDatabase(newDates);
  };

  const handleMonthChange = (date) => {
    setCurrentMonth(date);
  };

  const dateCellRender = (date) => {
    const dateKey = date.format('YYYY-MM-DD');
    const dateSchedule = selectedDates.get(dateKey);
    const dayName = date.format('dddd');
    
    // Wenn kein Schedule existiert, zeige Standard basierend auf workDays
    if (!dateSchedule && workDays.includes(dayName)) {
      return (
        <div style={{ backgroundColor: '#e6f7ff', padding: '2px', borderRadius: '4px' }}>
          {defaultStartTime.format('HH:mm')} - {defaultEndTime.format('HH:mm')}
          <div style={{ fontSize: '10px' }}><Tag color="blue">Standard</Tag></div>
        </div>
      );
    }

    if (dateSchedule) {
      const backgroundColor = dateSchedule.isDefault ? '#e6f7ff' : '#f6ffed';
      return (
        <div style={{ backgroundColor, padding: '2px', borderRadius: '4px' }}>
          {dateSchedule.isWorkDay ? (
            < >
              {dateSchedule.start.format('HH:mm')} - {dateSchedule.end.format('HH:mm')}
              {dateSchedule.isDefault && <div style={{ fontSize: '10px' }}><Tag color="blue">Standard</Tag></div>}
            </ >
          ) : (
            <Tag color="red">Arbeitsfrei</Tag>
          )}
        </div>
      );
    }
    
    return null;
  };

  return (
    <div>
      <h3>Arbeitszeitkonfiguration</h3>
      
      {/* Standard-Konfiguration */}
      <div style={{ marginBottom: '20px' }}>
        <h4>Standard-Arbeitszeiten</h4>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ marginRight: '10px' }}>Arbeitszeit von-bis: </label>
          <TimePicker.RangePicker
            format="HH:mm"
            value={[defaultStartTime, defaultEndTime]}
            onChange={(times) => {
              if (times && times[0] && times[1]) {
                setWorkStartTime(times[0].format('HH:mm'));
                setWorkEndTime(times[1].format('HH:mm'));
              }
            }}
          />
        </div>
        
        <div>
          <label style={{ marginRight: '10px' }}>Standard-Arbeitstage: </label>
          <Select
            mode="multiple"
            style={{ width: '400px' }}
            value={workDays}
            onChange={setWorkDays}
          >
            <Option value="Monday">Montag</Option>
            <Option value="Tuesday">Dienstag</Option>
            <Option value="Wednesday">Mittwoch</Option>
            <Option value="Thursday">Donnerstag</Option>
            <Option value="Friday">Freitag</Option>
            <Option value="Saturday">Samstag</Option>
            <Option value="Sunday">Sonntag</Option>
          </Select>
        </div>
      </div>

      <Divider />

      {/* Monatlicher Kalender */}
      <div>
        <h4>Monatliche Anpassungen</h4>
        <p>
          Klicken Sie auf einen Tag, um zwischen Arbeitstag und arbeitsfreiem Tag zu wechseln. 
          Wählen Sie einen Arbeitstag aus, um die Arbeitszeiten individuell anzupassen.
        </p>
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ flex: 2 }}>
            <Calendar
              fullscreen={false}
              onSelect={handleDateSelect}
              onPanelChange={handleMonthChange}
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
                }
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            {selectedDate && selectedDates.get(selectedDate.format('YYYY-MM-DD'))?.isWorkDay && (
              <div>
                <h4>Arbeitszeiten für {selectedDate.format('DD.MM.YYYY')}</h4>
                <TimePicker.RangePicker
                  format="HH:mm"
                  value={[
                    selectedDates.get(selectedDate.format('YYYY-MM-DD'))?.start,
                    selectedDates.get(selectedDate.format('YYYY-MM-DD'))?.end
                  ]}
                  onChange={handleTimeChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default GeneralConfig;
