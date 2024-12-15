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

router.get('/user/organization', async (req, res) => {
  try {
    const db = req.app.get('db');
    const userId = res.locals.oauth.token.user.user_id;
    const user = await db.collection('user').findOne({ _id: new ObjectId(userId) });

    if (!user || !user.organisation) {
      return res.status(404).json({ message: 'Keine Organisation gefunden' });
    }

    const organisationId = user.organisation;
    const objectId = new ObjectId(organisationId);
    const organisation = await db.collection('organisation').findOne({ _id: objectId });

    if (!organisation) {
      return res.status(404).json({ message: 'Organisation nicht gefunden' });
    }

    const defaultConfig = {
      workStartTime: '09:00',
      workEndTime: '17:00',
      workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    };

    const orgData = {
      ...organisation,
      default_config: organisation.default_config || defaultConfig
    };

    res.json(orgData);
  } catch (error) {
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

router.delete('/user/:id/organisation', async (req, res) => {
  const { id } = req.params;
  try {
    const db = req.app.get('db');
    const result = await db.collection('user').updateOne(
      { _id: new ObjectId(id) },
      { 
        $unset: { organisation: '' },
        $set: { role: 'user' }
      }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: 'Organisation erfolgreich gelöscht' });
    } else {
      res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

/*
router.post('/user/:id/organisation', async (req, res) => {
    const { id } = req.params;
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Token erforderlich' });
    }
  
    try{
      const db = req.app.get('db');
      const organisation = await db.collection('organisation').findOne({ token });

      if (!organisation) {
        return res.status(404).json({ message: 'Organisation nicht gefunden' });
      }

      const result = await db.collection('user').updateOne(
        { _id: new ObjectId(id) },
        { $set: { organisation: organisation._id } }
      );

      if (result.matchedCount === 0) {
        return res.status(404).json({ message: 'Benutzer nicht gefunden' });
      }

      res.status(200).json({
        message: 'Erfolgreich der Organisation beigetreten',
        organisation: organisation._id
      });
  } catch (error) {
    console.error('Error joining organisation:', error);
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});
*/

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
    
    // Hole die Organisation und ihre Konfiguration
    const user = req.user;
    const organisation = await db.collection('organisation').findOne(
      { _id: new ObjectId(user.organisation) }
    );
    
    if (!organisation || !organisation.default_config) {
      return res.status(400).json({ error: 'Keine Organisationskonfiguration gefunden' });
    }

    // Hole die monatlichen Anpassungen
    const monthlyAdjustment = organisation.monthly_adjustments?.find(
      adj => adj.month === month
    );

    // Berechne den Dienstplan für jeden User
    const generatedSchedule = users.map(user => {
      const vacationDates = getVacationDaysFromPeriods(user.vacationPeriods);
      const weeklyHours = user.weeklyHours || 40; // Standard: 40 Stunden
      const workingDaysCount = organisation.default_config.workDays.length;
      const targetDailyHours = weeklyHours / workingDaysCount;

      // Erstelle den Monatsplan
      const monthStart = new Date(month + '-01');
      const monthEnd = new Date(new Date(monthStart).setMonth(monthStart.getMonth() + 1));
      const schedule = [];

      for (let date = new Date(monthStart); date < monthEnd; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleString('en-US', { weekday: 'long' });
        const isDefaultWorkDay = organisation.default_config.workDays.includes(dayName);
        
        // Suche nach monatlicher Anpassung für diesen Tag
        const dayAdjustment = monthlyAdjustment?.days.find(day => day.date === dateStr);
        const isVacationDay = vacationDates.includes(dateStr);

        let daySchedule = {
          date: dateStr,
          start: null,
          end: null,
          hours: 0,
          isVacationDay,
          isWorkDay: false
        };

        if (!isVacationDay) {
          if (dayAdjustment) {
            // Verwende die monatliche Anpassung
            if (dayAdjustment.isWorkDay) {
              const adjustedTime = calculateAdjustedWorkTime(
                dayAdjustment.startTime,
                dayAdjustment.endTime,
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
          } else if (isDefaultWorkDay) {
            // Verwende die Standard-Konfiguration
            const adjustedTime = calculateAdjustedWorkTime(
              organisation.default_config.workStartTime,
              organisation.default_config.workEndTime,
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

      const totalHours = schedule.reduce((sum, day) => sum + day.hours, 0);

      return {
        userId: user._id,
        username: `${user.first_name} ${user.last_name}`,
        weeklyHours,
        totalHours: Math.round(totalHours * 100) / 100,
        schedule
      };
    });

    // Speichere den generierten Dienstplan
    const result = await db.collection('schedules').insertOne({
      month,
      organisation_id: organisation._id,
      generatedAt: new Date(),
      schedule: generatedSchedule
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

// Anpassung der GET-Route für Schedules
router.get('/work-schedule/:month', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { month } = req.params;
    const userId = res.locals.oauth.token.user.user_id;
    
    // Hole erst den User und seine Organisation
    const user = await db.collection('user').findOne({ _id: new ObjectId(userId) });
    if (!user?.organisation) {
      return res.status(404).json({ message: 'Keine Organisation gefunden' });
    }

    // Hole den Schedule für den Monat und die Organisation
    const schedule = await db.collection('schedules').findOne({ 
      month,
      organisation_id: new ObjectId(user.organisation)
    });
    
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

// ************** CONFIG ROUTES **************

router.put('/organization/:id/work-config', isAdminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { workStartTime, workEndTime, workDays } = req.body;

  if (!workStartTime || !workEndTime || !workDays) {
    return res.status(400).json({ message: 'Unvollständige Konfigurationsdaten' });
  }

  try {
    const db = req.app.get('db');
    const result = await db.collection('organisation').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          default_config: {
            workStartTime,
            workEndTime,
            workDays,
            updatedAt: new Date()
          }
        } 
      }
    );

    if (result.modifiedCount === 1) {
      res.status(200).json({ message: 'Arbeitszeitkonfiguration erfolgreich aktualisiert' });
    } else {
      res.status(404).json({ error: 'Organisation nicht gefunden' });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

router.post('/organization/:id/monthly-adjustment', isAdminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { year, month, days } = req.body;

  try {
    const db = req.app.get('db');
    
    // Aktualisiere oder füge neue monatliche Anpassung hinzu
    const result = await db.collection('organisation').updateOne(
      { 
        _id: new ObjectId(id),
        'monthly_adjustments.month': month 
      },
      { 
        $set: { 
          'monthly_adjustments.$.year': year,
          'monthly_adjustments.$.days': days
        }
      }
    );

    // Wenn keine existierende Anpassung aktualisiert wurde, füge eine neue hinzu
    if (result.matchedCount === 0) {
      await db.collection('organisation').updateOne(
        { _id: new ObjectId(id) },
        { 
          $push: { 
            monthly_adjustments: {
              year,
              month,
              days
            }
          }
        }
      );
    }

    res.status(200).json({ message: 'Monatliche Anpassung erfolgreich gespeichert' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

router.get('/organization/:id/monthly-adjustment/:month', isAdminMiddleware, async (req, res) => {
  const { id, month } = req.params;

  try {
    const db = req.app.get('db');
    const organisation = await db.collection('organisation').findOne(
      { _id: new ObjectId(id) }
    );

    if (!organisation) {
      return res.status(404).json({ message: 'Organisation nicht gefunden' });
    }

    const monthlyAdjustment = organisation.monthly_adjustments?.find(
      adj => adj.month === month
    );

    if (monthlyAdjustment) {
      res.json(monthlyAdjustment);
    } else {
      res.json({
        year: parseInt(month.split('-')[0]),
        month,
        days: []
      });
    }
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

// ************** WORK SCHEDULE ROUTES **************

router.post('/work-schedule', isAdminMiddleware, async (req, res) => {
  const { month, schedule, defaultConfig } = req.body;

  try {
    const db = req.app.get('db');
    
    // Hole die Organisation des Users
    const user = req.user;
    const organisation = await db.collection('organisation').findOne(
      { _id: new ObjectId(user.organisation) }
    );
    
    // Verwende die gespeicherte Organisationskonfiguration
    const workConfig = organisation?.workConfig || defaultConfig;
    
    // Überprüfe, ob bereits ein Schedule für diesen Monat existiert
    const existingSchedule = await db.collection('schedules').findOne({ month });
    
    const scheduleData = {
      month,
      schedule,
      defaultConfig: workConfig, // Verwende die Organisations-Konfiguration
      updatedAt: new Date()
    };

    if (existingSchedule) {
      // Update existierenden Schedule
      await db.collection('schedules').updateOne(
        { month },
        { $set: scheduleData }
      );
    } else {
      // Erstelle neuen Schedule
      scheduleData.createdAt = new Date();
      await db.collection('schedules').insertOne(scheduleData);
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