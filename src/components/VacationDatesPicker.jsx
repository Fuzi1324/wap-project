import { useState } from 'react';
import PropTypes from 'prop-types';
import { DatePicker, Button, message, Space, List, Typography } from 'antd';
import dayjs from 'dayjs';
import 'dayjs/locale/de';
import locale from 'antd/es/date-picker/locale/de_DE';

const { RangePicker } = DatePicker;
const { Text } = Typography;

dayjs.locale('de');

const VacationDatesPicker = ({ initialVacationPeriods = [], onSave, maxVacationDays = 30 }) => {
  const [vacationPeriods, setVacationPeriods] = useState(
    (initialVacationPeriods || []).map(period => ({
      startDate: dayjs(period.startDate),
      endDate: dayjs(period.endDate)
    }))
  );

  VacationDatesPicker.prototypes = {
    initialVacationPeriods: PropTypes.array,
    onSave: PropTypes.func.isRequired,
    maxVacationDays: PropTypes.number
  };

  const [currentSelection, setCurrentSelection] = useState(null);

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

  const handleAddAndSaveVacation = async () => {
    if (!currentSelection) return;

    const newDays = currentSelection.endDate.diff(currentSelection.startDate, 'days') + 1;
    const currentTotalDays = calculateTotalVacationDays(vacationPeriods);

    if (currentTotalDays + newDays > maxVacationDays) {
      message.error(`Sie können nicht mehr als ${maxVacationDays} Urlaubstage im Jahr einplanen. (${currentTotalDays} bereits geplant)`);
      return;
    }

    const isOverlapping = vacationPeriods.some(period => {
      return !(currentSelection.endDate.isBefore(period.startDate) || 
               currentSelection.startDate.isAfter(period.endDate));
    });

    if (isOverlapping) {
      message.error('Der gewählte Zeitraum überschneidet sich mit bereits eingetragenen Urlaubstagen');
      return;
    }

    const updatedVacations = [...vacationPeriods, currentSelection];
    setVacationPeriods(updatedVacations);
    setCurrentSelection(null);

    try {
      const formattedVacations = updatedVacations.map(period => ({
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

  const handleRemoveVacation = async (index) => {
    const updatedVacations = vacationPeriods.filter((_, i) => i !== index);

    setVacationPeriods(updatedVacations);

    try {
      const formattedVacations = updatedVacations.map(period => ({
        startDate: period.startDate.format('YYYY-MM-DD'),
        endDate: period.endDate.format('YYYY-MM-DD')
      }));

      const success = await onSave(formattedVacations);
      if (success) {
        message.success('Urlaubstag erfolgreich entfernt');
      }
    } catch (error) {
      console.error('Error while removing vacation:', error);
      message.error(error.message || 'Fehler beim Entfernen des Urlaubstags');
    }
  };

  const disabledDate = (current) => {
    return current && (
      current < dayjs().startOf('day') ||
      current > dayjs().endOf('year')
    );
  };

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
          locale={locale}
          placeholder={['Von', 'Bis']}
        />
        <Button 
          type="primary" 
          onClick={handleAddAndSaveVacation}
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
                <Button key="remove" type="link" danger onClick={() => handleRemoveVacation(index)}>
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
    </Space>
  );
};

export default VacationDatesPicker;
