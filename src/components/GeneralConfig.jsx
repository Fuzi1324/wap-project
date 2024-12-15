import React, { useState, useEffect } from 'react';
import { Calendar, TimePicker, Select, Divider, message, Tag } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/de';
import localeData from 'dayjs/plugin/localeData';
import updateLocale from 'dayjs/plugin/updateLocale';

// Dayjs Konfiguration
dayjs.extend(localeData);
dayjs.extend(updateLocale);
dayjs.locale('de');

// Deutsche Lokalisierung
const DE_LOCALE = {
  weekStart: 1,
  weekdays: ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'],
  weekdaysShort: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
  weekdaysMin: ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'],
  months: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
  monthsShort: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez']
};

dayjs.updateLocale('de', DE_LOCALE);

const CALENDAR_LOCALE = {
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
};

const WEEKDAYS = [
  { label: 'Montag', value: 'Monday' },
  { label: 'Dienstag', value: 'Tuesday' },
  { label: 'Mittwoch', value: 'Wednesday' },
  { label: 'Donnerstag', value: 'Thursday' },
  { label: 'Freitag', value: 'Friday' },
  { label: 'Samstag', value: 'Saturday' },
  { label: 'Sonntag', value: 'Sunday' }
];

function GeneralConfig({ workStartTime, setWorkStartTime, workEndTime, setWorkEndTime, workDays, setWorkDays }) {
  const [selectedDates, setSelectedDates] = useState(new Map());
  const [selectedDate, setSelectedDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [organisationId, setOrganisationId] = useState(null);

  const defaultStartTime = dayjs(workStartTime, 'HH:mm');
  const defaultEndTime = dayjs(workEndTime, 'HH:mm');

  // API Funktionen
  const fetchMonthlyAdjustment = async (month) => {
    try {
      const response = await fetch(
        `/api/organization/${organisationId}/monthly-adjustment/${month.format('YYYY-MM')}`,
        {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        }
      );

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Fehler beim Laden der monatlichen Anpassung');
      }

      const data = await response.json();
      return data.days || [];
    } catch (error) {
      console.error('Error fetching monthly adjustment:', error);
      message.error('Fehler beim Laden der monatlichen Anpassung');
      return null;
    }
  };

  const saveMonthlyAdjustment = async (adjustmentData) => {
    if (!organisationId) {
      message.error('Organisation konnte nicht gefunden werden');
      return;
    }

    try {
      const adjustmentToSave = Array.from(adjustmentData.entries())
        .filter(([_, times]) => !times.isDefault) // Nur nicht-Standard Tage speichern
        .map(([date, times]) => ({
          date,
          startTime: times.start?.format('HH:mm'),
          endTime: times.end?.format('HH:mm'),
          isWorkDay: times.isWorkDay,
          isDefault: false
        }));

      const response = await fetch(`/api/organization/${organisationId}/monthly-adjustment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          year: currentMonth.year(),
          month: currentMonth.format('YYYY-MM'),
          days: adjustmentToSave
        })
      });

      if (!response.ok) throw new Error('Fehler beim Speichern');
      message.success('Monatliche Anpassung wurde gespeichert');
    } catch (error) {
      console.error('Error saving monthly adjustment:', error);
      message.error('Fehler beim Speichern der monatlichen Anpassung');
    }
  };

  // Hilfsfunktionen
  const createDefaultSchedule = (startTime = defaultStartTime, endTime = defaultEndTime, selectedWorkDays = workDays) => {
    const newSelectedDates = new Map();
    const startDate = currentMonth.startOf('month');
    
    for (let i = 0; i < currentMonth.daysInMonth(); i++) {
      const date = startDate.clone().add(i, 'day');
      const dateKey = date.format('YYYY-MM-DD');
      const englishDayName = date.locale('en').format('dddd');
      const isWorkDay = selectedWorkDays.includes(englishDayName);
      
      newSelectedDates.set(dateKey, {
        start: startTime,
        end: endTime,
        isDefault: true,
        isWorkDay
      });
    }
    
    return newSelectedDates;
  };

  const processMonthlyAdjustment = (adjustmentData) => {
    const newSelectedDates = createDefaultSchedule();
    
    if (!adjustmentData) return newSelectedDates;

    adjustmentData.forEach(adjustment => {
      if (newSelectedDates.has(adjustment.date)) {
        newSelectedDates.set(adjustment.date, {
          start: dayjs(adjustment.startTime, 'HH:mm'),
          end: dayjs(adjustment.endTime, 'HH:mm'),
          isDefault: false,
          isWorkDay: adjustment.isWorkDay
        });
      }
    });

    return newSelectedDates;
  };

  // Event Handler
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    const dateKey = date.format('YYYY-MM-DD');
    const dayName = date.locale('en').format('dddd');
    const isDefaultWorkDay = workDays.includes(dayName);
    
    const newDates = new Map(selectedDates);
    const currentSettings = selectedDates.get(dateKey) || {
      start: defaultStartTime,
      end: defaultEndTime,
      isDefault: true,
      isWorkDay: isDefaultWorkDay
    };

    const newIsWorkDay = !currentSettings.isWorkDay;
    
    newDates.set(dateKey, {
      start: newIsWorkDay ? defaultStartTime : currentSettings.start,
      end: newIsWorkDay ? defaultEndTime : currentSettings.end,
      isDefault: newIsWorkDay && isDefaultWorkDay,
      isWorkDay: newIsWorkDay
    });

    setSelectedDates(newDates);
    saveMonthlyAdjustment(newDates);
  };

  const handleTimeChange = (times) => {
    if (!selectedDate || !times) return;
    
    const dateKey = selectedDate.format('YYYY-MM-DD');
    const dayName = selectedDate.locale('en').format('dddd');
    const isDefaultWorkDay = workDays.includes(dayName);
    
    const newDates = new Map(selectedDates);
    newDates.set(dateKey, {
      start: times[0],
      end: times[1],
      isDefault: isDefaultWorkDay && 
                times[0].isSame(defaultStartTime, 'minute') && 
                times[1].isSame(defaultEndTime, 'minute'),
      isWorkDay: true
    });
    
    setSelectedDates(newDates);
    saveMonthlyAdjustment(newDates);
  };

  const handleWorkDaysChange = async (newWorkDays) => {
    if (!organisationId) {
      message.error('Organisation konnte nicht gefunden werden');
      return;
    }
  
    try {
      await fetch(`/api/organization/${organisationId}/work-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          workStartTime,
          workEndTime,
          workDays: newWorkDays
        })
      });
      
      setWorkDays(newWorkDays);
      
      // Aktualisiere den Kalender mit den neuen Standardtagen
      const newDates = createDefaultSchedule(defaultStartTime, defaultEndTime, newWorkDays);
      setSelectedDates(newDates);
      saveMonthlyAdjustment(newDates);
    } catch (error) {
      console.error('Error updating work days:', error);
      message.error('Fehler beim Speichern der Arbeitstage');
    }
  };
  
  const handleStandardConfigChange = async (newStartTime, newEndTime) => {
    if (!newStartTime || !newEndTime) return;
    
    if (!organisationId) {
      message.error('Organisation konnte nicht gefunden werden');
      return;
    }
  
    try {
      await fetch(`/api/organization/${organisationId}/work-config`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          workStartTime: newStartTime.format('HH:mm'),
          workEndTime: newEndTime.format('HH:mm'),
          workDays
        })
      });
      
      setWorkStartTime(newStartTime.format('HH:mm'));
      setWorkEndTime(newEndTime.format('HH:mm'));
      
      // Aktualisiere den Kalender mit den neuen Standardzeiten
      const newDates = createDefaultSchedule(newStartTime, newEndTime, workDays);
      setSelectedDates(newDates);
      saveMonthlyAdjustment(newDates);
    } catch (error) {
      console.error('Error updating work times:', error);
      message.error('Fehler beim Speichern der Arbeitszeiten');
    }
  };

  // Render Funktionen
  const renderDateCell = (date) => {
    const dateKey = date.format('YYYY-MM-DD');
    const dateSchedule = selectedDates.get(dateKey);
    const dayName = date.locale('en').format('dddd');
    const isDefaultWorkDay = workDays.includes(dayName);
    
    if (!dateSchedule) {
      if (isDefaultWorkDay) {
        return (
          <div className="date-cell default">
            {defaultStartTime.format('HH:mm')} - {defaultEndTime.format('HH:mm')}
            <div className="tag-container"><Tag color="blue">Standard</Tag></div>
          </div>
        );
      }
      return <Tag color="red">Arbeitsfrei</Tag>;
    }

    return (
      <div className={`date-cell ${dateSchedule.isDefault ? 'default' : 'custom'}`}>
        {dateSchedule.isWorkDay ? (
          <>
            {dateSchedule.start.format('HH:mm')} - {dateSchedule.end.format('HH:mm')}
            {dateSchedule.isDefault && <div className="tag-container"><Tag color="blue">Standard</Tag></div>}
          </>
        ) : (
          <Tag color="red">Arbeitsfrei</Tag>
        )}
      </div>
    );
  };

  // Effects
  useEffect(() => {
    const loadMonthlyAdjustment = async () => {
      if (organisationId) {
        const adjustment = await fetchMonthlyAdjustment(currentMonth);
        const dates = processMonthlyAdjustment(adjustment);
        setSelectedDates(dates);
        setIsInitialLoad(false);
      }
    };

    loadMonthlyAdjustment();
  }, [currentMonth, organisationId]);

  useEffect(() => {
    const loadOrganization = async () => {
      try {
        const response = await fetch('/api/user/organization', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        });
        
        if (!response.ok) {
          if (response.status === 404) {
            return;
          }
          throw new Error('Fehler beim Laden der Organisation');
        }
        
        const data = await response.json();
        
        if (data._id) {
          setOrganisationId(data._id);
          
          if (data.default_config) {
            setWorkStartTime(data.default_config.workStartTime);
            setWorkEndTime(data.default_config.workEndTime);
            setWorkDays(data.default_config.workDays);
          }
        }
      } catch (error) {
        console.error('Error loading organization:', error);
        if (!error.message.includes('404')) {
          message.error('Fehler beim Laden der Organisation');
        }
      }
    };
    
    loadOrganization();
  }, []);

  return (
    <div className="general-config">
      <h3>Arbeitszeitkonfiguration</h3>
      
      <div className="standard-config">
        <h4>Standard-Arbeitszeiten</h4>
        <div className="time-picker-container">
          <label>Arbeitszeit von-bis: </label>
          <TimePicker.RangePicker
            format="HH:mm"
            value={[defaultStartTime, defaultEndTime]}
            onChange={(times) => times && handleStandardConfigChange(times[0], times[1])}
          />
        </div>
        
        <div className="weekday-selector">
          <label>Standard-Arbeitstage: </label>
          <Select
            mode="multiple"
            style={{ width: '400px' }}
            value={workDays}
            onChange={handleWorkDaysChange}
            options={WEEKDAYS}
          />
        </div>
      </div>

      <Divider />

      <div className="monthly-config">
        <h4>Monatliche Anpassungen</h4>
        <p className="instructions">
          Klicken Sie auf einen Tag, um zwischen Arbeitstag und arbeitsfreiem Tag zu wechseln. 
          Wählen Sie einen Arbeitstag aus, um die Arbeitszeiten individuell anzupassen.
        </p>
        <div className="calendar-container">
          <div className="calendar">
            <Calendar
              fullscreen={false}
              onSelect={handleDateSelect}
              onPanelChange={setCurrentMonth}
              dateCellRender={renderDateCell}
              locale={CALENDAR_LOCALE}
            />
          </div>
          <div className="time-selector">
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