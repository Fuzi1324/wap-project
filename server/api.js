import express from 'express';
import { ObjectId } from 'mongodb';

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
  const { workStartTime, workEndTime, workDays, users } = req.body;

  try {
    const db = req.app.get('db');
    const totalHoursPerDay = (new Date(`1970-01-01T${workEndTime}`) - new Date(`1970-01-01T${workStartTime}`)) / 3600000;

    const schedule = users.map(user => {
      const vacationDates = user.vacationDates || [];
      const dailyHours = Math.min(user.weeklyHours / workDays.length, totalHoursPerDay);

      return {
        user: user.username,
        schedule: workDays.map(day => {
          try {
            const dayDate = day instanceof Date ? day : new Date(day);
            const isVacationDay = vacationDates.includes(dayDate);

            return {
              day: dayDate,
              start: isVacationDay ? null : workStartTime,
              end: isVacationDay ? null : workEndTime,
              hours: isVacationDay ? 0 : dailyHours
            };
          } catch (error) {
            return {
              day: day,
              start: null,
              end: null,
              hours: 0
            };
          }
        })
      };
    });
    
    const result = await db.collection('schedules').insertOne({
      generatedAt: new Date(),
      workStartTime,
      workEndTime,
      workDays,
      schedule
    });

    res.json({ schedule, message: 'Dienstplan erfolgreich generiert und gespeichert', scheduleId: result.insertedId });
  } catch (error) {
    res.status(500).json({ error: 'Fehler beim Generieren des Dienstplans' });
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

// ************** ERROR HANDLING **************

router.use((req, res) => {
  res.status(404).send('404: Seite nicht gefunden');
});

export default router;
