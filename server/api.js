import express from 'express';
import { ObjectId } from 'mongodb';
import dayjs from 'dayjs';

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

// ************** AUTH ROUTES **************

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  res.json({ message: 'Loginversuch empfangen', status: 'success' });
});

router.post('/check-email', async (req, res) => {
  try {
      const db = req.app.get('db');
      const { email } = req.body;

      if (!email) {
          return res.status(400).json({ message: 'E-Mail ist erforderlich' });
      }

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

// ************** ADMIN ROUTES **************

router.get('/organization/users', isAdminMiddleware, async (req, res) => {
  try {
    const db = req.app.get('db');
    
    const adminId = res.locals.oauth.token.user.user_id;
    const admin = await db.collection('user').findOne({ _id: new ObjectId(adminId) });
    
    if (!admin?.organisation) {
      return res.status(404).json({ message: 'Keine Organisation gefunden' });
    }

    const users = await db.collection('user')
      .find({ 
        organisation: new ObjectId(admin.organisation)
      })
      .toArray();

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

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

// ************** SCHEDULE ROUTES **************

router.post('/generate-schedule', isAdminMiddleware, async (req, res) => {
  const { month, users } = req.body;

  if (!month || !users) {
    return res.status(400).json({ error: 'Monat und Benutzerdaten sind erforderlich' });
  }

  try {
    const db = req.app.get('db');
    
    const user = req.user;
    const organisation = await db.collection('organisation').findOne(
      { _id: new ObjectId(user.organisation) }
    );
    
    if (!organisation || !organisation.default_config) {
      return res.status(400).json({ error: 'Keine Organisationskonfiguration gefunden' });
    }

    const monthlyAdjustment = organisation.monthly_adjustments?.find(
      adj => adj.month === month
    );

    const generatedSchedule = users.map(user => {
      const vacationDates = getVacationDaysFromPeriods(user.vacationPeriods);
      const weeklyHours = user.weeklyHours || 40;
      const workingDaysCount = organisation.default_config.workDays.length;
      const targetDailyHours = weeklyHours / workingDaysCount;

      const monthStart = new Date(month + '-01');
      const monthEnd = new Date(new Date(monthStart).setMonth(monthStart.getMonth() + 1));
      const schedule = [];

      for (let date = new Date(monthStart); date < monthEnd; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        const dayName = date.toLocaleString('en-US', { weekday: 'long' });
        const isDefaultWorkDay = organisation.default_config.workDays.includes(dayName);
        
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
    res.status(500).json({ error: 'Fehler bei der Dienstplangenerierung' });
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

// ************** Organisation ROUTES **************

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

router.get('/user/organization-admin', async (req, res) => {
  try {
    const db = req.app.get('db');
    const userId = res.locals.oauth.token.user.user_id;
    const user = await db.collection('user').findOne({ _id: new ObjectId(userId) });

    if (!user || !user.organisation) {
      return res.status(404).json({ message: 'Keine Organisation gefunden' });
    }

    const organisationId = user.organisation;

    const organisationEmployees = await db.collection('user').find({ organisation: new ObjectId(organisationId) }).toArray();
    let admin = 'Max Mustermann';

    organisationEmployees.forEach(employee => {
      if(employee.role === 'admin') {
        admin = {
          name: `${employee.first_name} ${employee.last_name}`
        };
      }
    });

    if (!admin) {
      return res.status(404).json({ message: 'Kein Admin gefunden' });
    }

    res.json(admin);
  } catch (error) {
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
})

router.delete('/user/:id/organisation', async (req, res) => {
  const { id } = req.params;
  try {
    const db = req.app.get('db');
    const user = await db.collection('user').findOne({ _id: new ObjectId(id) });
    
    if (!user) {
      return res.status(404).json({ message: 'Benutzer nicht gefunden' });
    }

    const orgId = user.organisation;

    if (user.role === 'admin') {
      await db.collection('user').updateMany(
        { organisation: new ObjectId(orgId) },
        { $unset: { organisation: '' }, $set: { role: 'user' } }
      );

      await db.collection('organisation').deleteOne({ _id: new ObjectId(orgId) });
      return res.status(200).json({ message: 'Gesamte Organisation erfolgreich gelöscht!' });
    }

    if (user.role === 'user') {
      await db.collection('user').updateOne(
        { _id: new ObjectId(id) },
        { $unset: { organisation: '' } }
      );
      return res.status(200).json({ message: 'Erfolgreich aus der Organisation ausgetreten!' });
    }

    return res.status(400).json({ error: 'Löschen oder austreten fehlgeschlagen!' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/user/:id/join-organisation', async (req, res) => {
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
        organisationId: organisation._id,
        organization: organisation
      });
  } catch (error) {
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

router.put('/user/:id/create-organisation', async (req, res) => {
  const { id } = req.params;
  const { name, address, token } = req.body;

  if (!name || !address) {
    return res.status(400).json({ message: 'Ungültige Organisationsdaten' });
  }

  try {
    const db = req.app.get('db');
    const orgResult = await db.collection('organisation').insertOne({
      name,
      address,
      token,
      admin: new ObjectId(id)
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
      const orgData = await db.collection('organisation').findOne({ _id: orgResult.insertedId });
      res.status(200).json({ 
        message: 'Organisation erfolgreich aktualisiert',
        organisationId: orgResult.insertedId,
        organization: orgData
      });
    } else {
      res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

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
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

router.post('/organization/:id/monthly-adjustment', isAdminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { year, month, days } = req.body;

  try {
    const db = req.app.get('db');

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
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

router.get('/organization/:id/schedules', async (req, res) => {
  try {
    const db = req.app.get('db');
    const organisation_id = req.params.id;

    const schedules = await db.collection('schedules')
      .find({ 
        organisation_id: new ObjectId(organisation_id) 
      })
      .toArray();
    
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: 'Interner Serverfehler' });
  }
});

// ************** ERROR HANDLING **************

router.use((req, res) => {
  res.status(404).send('404: Seite nicht gefunden');
});

function calculateHours(startTime, endTime) {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  return (endHour + endMinute/60) - (startHour + startMinute/60);
}

function calculateAdjustedWorkTime(startTime, endTime, targetHours) {
  const start = dayjs(`2000-01-01 ${startTime}`);
  const end = dayjs(`2000-01-01 ${endTime}`);
  const totalMinutes = end.diff(start, 'minute');
  const targetMinutes = targetHours * 60;

  if (targetMinutes < totalMinutes) {
    const adjustedEnd = start.add(targetMinutes, 'minute');
    return {
      start: startTime,
      end: adjustedEnd.format('HH:mm')
    };
  }

  return { start: startTime, end: endTime };
}

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