import React, { useState } from 'react';
import { DatePicker, Button, message, Space, List } from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

const VacationDatesPicker = ({ initialVacations = [], onSave }) => {
  const [vacationPeriods, setVacationPeriods] = useState(
    initialVacations.map(period => ({
      startDate: dayjs(period.startDate),
      endDate: dayjs(period.endDate)
    }))
  );
  const [currentSelection, setCurrentSelection] = useState(null);

  const handleDateRangeSelect = (dates) => {
    if (!dates) {
      setCurrentSelection(null);
      return;
    }

    const [startDate, endDate] = dates;
    setCurrentSelection({
      startDate,
      endDate: endDate || startDate // If no end date, use start date
    });
  };

  const handleAddVacation = () => {
    if (!currentSelection) return;

    // Check for overlapping periods
    const isOverlapping = vacationPeriods.some(period => {
      return !(currentSelection.endDate.isBefore(period.startDate) || 
               currentSelection.startDate.isAfter(period.endDate));
    });

    if (isOverlapping) {
      message.error('Der gewählte Zeitraum überschneidet sich mit bereits eingetragenen Urlaubstagen');
      return;
    }

    setVacationPeriods([...vacationPeriods, currentSelection]);
    setCurrentSelection(null);
  };

  const handleRemoveVacation = (index) => {
    setVacationPeriods(vacationPeriods.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      // Convert dayjs objects to ISO string dates
      const formattedVacations = vacationPeriods.map(period => ({
        startDate: period.startDate.format('YYYY-MM-DD'),
        endDate: period.endDate.format('YYYY-MM-DD')
      }));

      const success = await onSave(formattedVacations);
      if (success) {
        message.success('Urlaubstage erfolgreich gespeichert');
      }
    } catch (error) {
      console.error('Error in VacationDatesPicker:', error);
      message.error(error.message || 'Fehler beim Speichern der Urlaubstage');
    }
  };

  const disabledDate = (current) => {
    // Disable dates before today and after current year
    return current && (
      current < dayjs().startOf('day') ||
      current > dayjs().endOf('year')
    );
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <div>
        <h4>Urlaubszeitraum auswählen</h4>
        <RangePicker
          value={currentSelection ? [currentSelection.startDate, currentSelection.endDate] : null}
          onChange={handleDateRangeSelect}
          disabledDate={disabledDate}
          style={{ width: '100%' }}
        />
        <Button 
          type="primary" 
          onClick={handleAddVacation}
          disabled={!currentSelection}
          style={{ marginTop: 8 }}
        >
          Zeitraum hinzufügen
        </Button>
      </div>

      <div style={{ marginTop: '16px' }}>
        <h4>Geplante Urlaubstage:</h4>
        <List
          size="small"
          dataSource={vacationPeriods.sort((a, b) => a.startDate.valueOf() - b.startDate.valueOf())}
          renderItem={(period, index) => (
            <List.Item
              actions={[
                <Button type="link" danger onClick={() => handleRemoveVacation(index)}>
                  Entfernen
                </Button>
              ]}
            >
              {period.startDate.format('DD.MM.YYYY')} - {period.endDate.format('DD.MM.YYYY')}
              {period.startDate.isSame(period.endDate, 'day') ? ' (1 Tag)' : 
               ` (${period.endDate.diff(period.startDate, 'days') + 1} Tage)`}
            </List.Item>
          )}
        />
      </div>

      <Button 
        type="primary" 
        onClick={handleSave}
        disabled={vacationPeriods.length === 0}
        style={{ marginTop: 16 }}
      >
        Alle Urlaubstage speichern
      </Button>
    </Space>
  );
};

export default VacationDatesPicker;
