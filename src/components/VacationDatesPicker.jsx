import React, { useState } from 'react';
import { DatePicker, Button, message, Space, List, Typography } from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Text } = Typography;

const VacationDatesPicker = ({ initialVacations = [], onSave, maxVacationDays }) => {
  const [vacationPeriods, setVacationPeriods] = useState(
    initialVacations.map(period => ({
      startDate: dayjs(period.startDate),
      endDate: dayjs(period.endDate)
    }))
  );
  const [currentSelection, setCurrentSelection] = useState(null);

  // Berechne die Gesamtzahl der bereits geplanten Urlaubstage
  const calculateTotalVacationDays = (periods) => {
    return periods.reduce((total, period) => {
      return total + (period.endDate.diff(period.startDate, 'days') + 1);
    }, 0);
  };

  const handleDateRangeSelect = (dates) => {
    if (!dates) {
      setCurrentSelection(null);
      return;
    }

    const [startDate, endDate] = dates;
    setCurrentSelection({
      startDate,
      endDate: endDate || startDate
    });
  };

  const handleAddVacation = () => {
    if (!currentSelection) return;

    // Berechne die Anzahl der Tage für die neue Auswahl
    const newDays = currentSelection.endDate.diff(currentSelection.startDate, 'days') + 1;
    const currentTotalDays = calculateTotalVacationDays(vacationPeriods);

    // Überprüfe, ob das Limit überschritten würde
    if (currentTotalDays + newDays > maxVacationDays) {
      message.error(`Sie können nicht mehr als ${maxVacationDays} Urlaubstage im Jahr einplanen. (${currentTotalDays} bereits geplant)`);
      return;
    }

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
      // Finale Überprüfung vor dem Speichern
      const totalDays = calculateTotalVacationDays(vacationPeriods);
      if (totalDays > maxVacationDays) {
        message.error(`Die Gesamtzahl der Urlaubstage (${totalDays}) überschreitet das erlaubte Maximum von ${maxVacationDays} Tagen.`);
        return;
      }

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

  // Berechne verbleibende Urlaubstage
  const totalVacationDays = calculateTotalVacationDays(vacationPeriods);
  const remainingDays = maxVacationDays - totalVacationDays;

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <div>
        <h4>Urlaubszeitraum auswählen</h4>
        <div style={{ marginBottom: 8 }}>
          <Text type="secondary">
            Verbleibende Urlaubstage: {remainingDays} von {maxVacationDays}
          </Text>
        </div>
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
