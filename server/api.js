import express from 'express';
import { ObjectId } from 'mongodb';
import dayjs from 'dayjs'; // Import dayjs library

const router = express.Router();

// ************** MIDDLEWARES **************

async function isAdminMiddleware(req, res, next) {
  const db = req.app.get('db');
  const user = await db.collection('user').findOne({ _id: new ObjectId(res.locals?.oauth?.token?.user?.user_id) });
  if (user?.role === 'admin') {
    req.user = user;
    next();
  } else {
    res.status(403).send();
  }
}

// ************** USER ROUTES **************

router.get('/user/me', async (req, res) => {
  try {
    const db = req.app.get('db');
    const userId = res.locals.oauth.token.user.user_id;
    
    if (!userId || !ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Ungültige Benutzer-ID' });
    }

    const objectId = new ObjectId(userId);
    const user = await db.collection('user').findOne({ _id: objectId });
    
    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }

    const userAuth = await db.collection('user_auth').findOne({ user_id: objectId });
    const userData = {
      ...user,
      username: userAuth?.username
    };

    res.json(userData);
  } catch (error) {
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

router.put('/user/:id/organisation', async (req, res) => {
  const { id } = req.params;
  const { name, address, token } = req.body;

  if (!name || !address) {
    return res.status(400).json({ message: 'Ungültige Organisationsdaten' });
  }

  try {
    const db = req.app.get('db');

    const orgResult = await db.collection('organisation').insertOne({
      name: name,
      address: address,
      token: token
    });

    const result = await db.collection('user').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          organisation: orgResult.insertedId,
          role: 'admin'
        } 
      }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ 
        message: 'Organisation erfolgreich aktualisiert',
        organisationId: orgResult.insertedId
      });
    } else {
      res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

// ************** TIME MANAGEMENT ROUTES **************

router.put('/user/:id/weeklyHours', isAdminMiddleware, async (req, res) => {
  try {
    const db = req.app.get('db');
    const { weeklyHours } = req.body;
    const userId = req.params.id;

    const result = await db.collection('user').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { weeklyHours: parseInt(weeklyHours, 10) } }
    );

    if (result.modifiedCount === 1) {
      res.json({ message: 'Wochenstunden erfolgreich aktualisiert' });
    } else {
      res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Wochenstunden' });
  }
});

router.put('/user/:id/vacation-periods', async (req, res) => {
  const { id } = req.params;
  const { vacationPeriods } = req.body;

  if (!vacationPeriods || !Array.isArray(vacationPeriods)) {
    return res.status(400).json({ message: 'Ungültige Urlaubsdaten' });
  }

  try {
    const db = req.app.get('db');
    const result = await db.collection('user').updateOne(
      { _id: new ObjectId(id) },
      { $set: { vacationPeriods: vacationPeriods } }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: 'Urlaubsperioden erfolgreich aktualisiert' });
    } else {
      res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

router.delete('/user/:id/vacation-periods', async (req, res) => {
  const { id } = req.params;
  try {
    const db = req.app.get('db');
    const result = await db.collection('user').updateOne(
      { _id: new ObjectId(id) },
      { $unset: { vacationPeriods: '' } }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: 'Urlaubsperioden erfolgreich gelöscht' });
    } else {
      res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

router.put('/user/:id/vacation-days', isAdminMiddleware, async (req, res) => {
  const { vacationDays } = req.body;
  try {
    const db = req.app.get('db');
    const result = await db.collection('user').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { vacationDays: parseInt(vacationDays, 10) } }
    );

    if (result.modifiedCount === 1) {
      res.json({ message: 'Urlaubstage erfolgreich aktualisiert' });
    } else {
      res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Urlaubstage' });
  }
});

// ************** ADMIN ROUTES **************

router.get('/all-users', async (req, res) => {
  try {
    const db = req.app.get('db');
    const users = await db.collection('user').find({}).toArray();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

// ************** SCHEDULE ROUTES **************

router.post('/generate-schedule', isAdminMiddleware, async (req, res) => {
  const { month, users } = req.body;

  if (!month || !users) {
    return res.status(400).json({ error: 'Monat und Benutzerdaten sind erforderlich' });
  }

  try {
    const db = req.app.get('db');
    
    // Hole die bestehende Konfiguration für den Monat aus der schedules Collection
    const existingSchedule = await db.collection('schedules').findOne({ month });
    
    // Standard-Konfiguration, falls keine existiert
    const defaultConfig = existingSchedule?.defaultConfig || {
      workStartTime: '09:00',
      workEndTime: '17:00',
      workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    };

    const monthlySchedule = existingSchedule?.schedule || [];
    
    // Erstelle ein Map für schnellen Zugriff auf die täglichen Arbeitszeiten
    const dailyScheduleMap = new Map(
      monthlySchedule.map(day => [day.date, day])
    );

    // Berechne den Dienstplan für jeden User
    const generatedSchedule = users.map(user => {
      const vacationDates = getVacationDaysFromPeriods(user.vacationPeriods);
      const weeklyHours = user.weeklyHours || 40; // Standard: 40 Stunden
      const workingDaysCount = defaultConfig.workDays.length;
      const targetDailyHours = weeklyHours / workingDaysCount;

      // Erstelle den Monatsplan
      const monthStart = new Date(month + '-01');
      const monthEnd = new Date(new Date(monthStart).setMonth(monthStart.getMonth() + 1));
      const schedule = [];

      for (let date = new Date(monthStart); date < monthEnd; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleString('en-US', { weekday: 'long' });
        const isDefaultWorkDay = defaultConfig.workDays.includes(dayName);
        const monthlyOverride = dailyScheduleMap.get(dateStr);
        const isVacationDay = vacationDates.includes(dateStr);

        // Bestimme die Arbeitszeiten für diesen Tag
        let daySchedule = {
          date: dateStr,
          start: null,
          end: null,
          hours: 0,
          isVacationDay,
          isWorkDay: false
        };

        // Prüfe zuerst, ob der Tag als arbeitsfrei markiert wurde
        if (!isVacationDay && monthlyOverride) {
          if (monthlyOverride.isWorkDay === false) {
            // Tag wurde explizit als arbeitsfrei markiert
            schedule.push(daySchedule);
            continue;
          }
        }

        if (!isVacationDay && (isDefaultWorkDay || (monthlyOverride && monthlyOverride.isWorkDay))) {
          if (monthlyOverride) {
            // Verwende die monatliche Überschreibung mit angepassten Stunden
            const adjustedTime = calculateAdjustedWorkTime(
              monthlyOverride.startTime,
              monthlyOverride.endTime,
              targetDailyHours
            );
            daySchedule = {
              ...daySchedule,
              start: adjustedTime.start,
              end: adjustedTime.end,
              hours: targetDailyHours,
              isWorkDay: true
            };
          } else {
            // Verwende die Standard-Konfiguration mit angepassten Stunden
            const adjustedTime = calculateAdjustedWorkTime(
              defaultConfig.workStartTime,
              defaultConfig.workEndTime,
              targetDailyHours
            );
            daySchedule = {
              ...daySchedule,
              start: adjustedTime.start,
              end: adjustedTime.end,
              hours: targetDailyHours,
              isWorkDay: true
            };
          }
        }

        schedule.push(daySchedule);
      }

      // Berechne die tatsächlichen Gesamtstunden
      const totalHours = schedule.reduce((sum, day) => sum + day.hours, 0);

      return {
        userId: user._id,
        username: `${user.first_name} ${user.last_name}`,
        weeklyHours,
        totalHours: Math.round(totalHours * 100) / 100, // Runde auf 2 Dezimalstellen
        schedule
      };
    });

    // Speichere den generierten Dienstplan in der schedules Collection
    const result = await db.collection('schedules').insertOne({
      month,
      generatedAt: new Date(),
      schedule: generatedSchedule,
      defaultConfig
    });

    res.json({ 
      message: 'Dienstplan erfolgreich generiert',
      scheduleId: result.insertedId 
    });
  } catch (error) {
    console.error('Error generating schedule:', error);
    res.status(500).json({ error: 'Fehler bei der Dienstplangenerierung' });
  }
});

router.get('/latest-schedule', async (req, res) => {
  try {
    const db = req.app.get('db');
    const latestSchedule = await db.collection('schedules')
      .find({})
      .sort({ generatedAt: -1 })
      .limit(1)
      .toArray();

    if (latestSchedule.length > 0) {
      res.json(latestSchedule[0]);
    } else {
      res.status(404).json({ message: 'Kein Dienstplan gefunden' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Abrufen des letzten Dienstplans' });
  }
});

router.get('/all-schedules', async (req, res) => {
  try {
    const db = req.app.get('db');
    const schedules = await db.collection('schedules').find({}).sort({ generatedAt: -1 }).toArray();
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

// ************** AUTH ROUTES **************

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  res.json({ message: 'Loginversuch empfangen', status: 'success' });
});

router.post('/check-email', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { email } = req.body;

    const existingUser = await db.collection('user_auth').findOne({ username: email });

    if (existingUser) {
      res.status(409).json({ message: 'E-Mail-Adresse bereits vergeben' });
    } else {
      res.status(200).json({ message: 'E-Mail-Adresse ist verfügbar' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

// ************** WORK SCHEDULE ROUTES **************

router.post('/work-schedule', isAdminMiddleware, async (req, res) => {
  const { month, schedule, defaultConfig } = req.body;

  try {
    const db = req.app.get('db');
    
    // Überprüfe, ob bereits ein Schedule für diesen Monat existiert
    const existingSchedule = await db.collection('schedules').findOne({ month });
    
    if (existingSchedule) {
      // Update existierenden Schedule
      await db.collection('schedules').updateOne(
        { month },
        { 
          $set: { 
            schedule,
            defaultConfig,
            updatedAt: new Date()
          } 
        }
      );
    } else {
      // Erstelle neuen Schedule
      await db.collection('schedules').insertOne({
        month,
        schedule,
        defaultConfig,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    res.status(200).json({ message: 'Arbeitszeiten erfolgreich gespeichert' });
  } catch (error) {
    console.error('Error saving work schedule:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

router.get('/work-schedule/:month', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { month } = req.params;
    
    const schedule = await db.collection('schedules').findOne({ month });
    
    if (schedule) {
      res.json(schedule);
    } else {
      res.status(404).json({ message: 'Kein Arbeitsplan für diesen Monat gefunden' });
    }
  } catch (error) {
    console.error('Error fetching work schedule:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
});

// ************** ERROR HANDLING **************

router.use((req, res) => {
  res.status(404).send('404: Seite nicht gefunden');
});

// Hilfsfunktion zur Berechnung der Arbeitsstunden
function calculateHours(startTime, endTime) {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  return (endHour + endMinute/60) - (startHour + startMinute/60);
}

// Hilfsfunktion zur Berechnung der angepassten Arbeitszeit
function calculateAdjustedWorkTime(startTime, endTime, targetHours) {
  const start = dayjs(`2000-01-01 ${startTime}`);
  const end = dayjs(`2000-01-01 ${endTime}`);
  const totalMinutes = end.diff(start, 'minute');
  const targetMinutes = targetHours * 60;

  // Wenn die Zielarbeitszeit kürzer ist als die Standardzeit
  if (targetMinutes < totalMinutes) {
    // Behalte die Startzeit bei und kürze nur am Ende
    const adjustedEnd = start.add(targetMinutes, 'minute');
    return {
      start: startTime,
      end: adjustedEnd.format('HH:mm')
    };
  }

  return { start: startTime, end: endTime };
}

// Hilfsfunktion zum Extrahieren aller Urlaubstage aus den Urlaubsperioden
function getVacationDaysFromPeriods(vacationPeriods) {
  if (!vacationPeriods || !Array.isArray(vacationPeriods)) return [];
  
  const allDays = [];
  vacationPeriods.forEach(period => {
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);
    
    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      allDays.push(date.toISOString().split('T')[0]);
    }
  });
  
  return allDays;
}

export default router;