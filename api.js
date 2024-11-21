import express from 'express';
import { ObjectId } from 'mongodb';

const router = express.Router();

async function writeAccess(req, res, next) {
  const db = req.app.get('db');
  // in authenticated middlewares (after `oauth.authenticate()`)
  // you will find the token in `res.locals.oauth.token`
  const user = await db.collection('user').findOne({ _id: new ObjectId(res.locals?.oauth?.token?.user?.user_id) });
  if (user?.permissions?.write) {
    res.locals.user = user; // we store a reference to the user object in `res.locals` for later use
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
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    const objectId = new ObjectId(userId);
    const user = await db.collection('user').findOne({ _id: objectId });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get email from user_auth collection
    const userAuth = await db.collection('user_auth').findOne({ user_id: objectId });

    // Combine user data
    const userData = {
      ...user,
      username: userAuth?.username
    };

    res.json(userData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/user/:id', writeAccess, async (req, res) => {
  try {
    const db = req.app.get('db');
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const user = await db.collection('user').findOne({ _id: new ObjectId(id) });

    if (user) {
      res.json(user);
    } else {
      res.status(404).send();
    }
  } catch(err) {
    console.error(err);
    res.status(500).send();
  }
});

router.put('/user/:id', writeAccess, async (req, res) => {
  try {
    const db = req.app.get('db');
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const updateData = req.body;
    delete updateData._id;

    const updated = await db.collection('user')
      .updateOne({ _id: new ObjectId(id) }, { $set: updateData });

    if (updated.modifiedCount === 1) {
      const user = await db.collection('user')
        .findOne({ _id: new ObjectId(id) });

      if (user) {
        res.json(user);
      } else {
        res.status(404).send();
      }
    } else {
      res.status(404).send();
    }
  } catch(err) {
    console.error(err);
    res.status(500).send();
  }
});

router.delete('/user/:id', writeAccess, async (req, res) => {
  try {
    const db = req.app.get('db');
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const deleted = await db.collection('user')
      .deleteOne({ _id: new ObjectId(id) });

    if (deleted.deletedCount === 1) {
      res.send();
    } else {
      res.status(404).send();
    }
  } catch(err) {
    console.error(err);
    res.status(500).send();
  }
});

// ************* ROUTES FOR USER-TIME-MANAGEMENT **************

router.put('/user/:id/weeklyHours', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { weeklyHours } = req.body;
    const userId = req.params.id;

    const result = await db.collection('user').updateOne(
      { _id: new ObjectId(userId) },
      { $set: { weeklyHours: parseInt(weeklyHours, 10) } }
    );

    if (result.modifiedCount === 1) {
      res.json({ message: 'Weekly hours updated successfully' });
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    console.error('Error updating weekly hours:', error);
    res.status(500).json({ error: 'Failed to update weekly hours' });
  }
});

router.put('/user/:id/vacation-weeks', async (req, res) => {
  const { vacationWeeks } = req.body;
  try {
    const db = req.app.get('db');
    const result = await db.collection('user').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { vacationWeeks: vacationWeeks } }
    );

    if (result.modifiedCount === 1) {
      res.json({ message: 'Urlaubswochen erfolgreich aktualisiert' });
    } else {
      res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Urlaubswochen:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Urlaubswochen' });
  }
});

router.put('/user/:id/vacation-dates', async (req, res) => {
  const { vacationDates } = req.body;
  try {
    const db = req.app.get('db');
    const result = await db.collection('user').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: { vacationDates: vacationDates } }
    );

    if (result.modifiedCount === 1) {
      res.json({ message: 'Urlaubstage erfolgreich aktualisiert' });
    } else {
      res.status(404).json({ error: 'Benutzer nicht gefunden' });
    }
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Urlaubstage:', error);
    res.status(500).json({ error: 'Fehler beim Aktualisieren der Urlaubstage' });
  }
});

// ************** ADMIN ROUTES **************

router.get('/admin', (req, res) => {
  res.send('Admin');
});

router.post('/generate-schedule', async (req, res) => {
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
            console.error(`Ungültiges Datumsformat für den Tag: ${day}`, error);
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
    console.error('Fehler beim Generieren des Dienstplans:', error);
    res.status(500).json({ error: 'Fehler beim Generieren des Dienstplans' });
  }
});

router.post('/check-email', async (req, res) => {
  try {
    const db = req.app.get('db');
    const { email } = req.body;

    // Suche nach der E-Mail in der user_auth Collection
    const existingUser = await db.collection('user_auth').findOne({ username: email });

    if (existingUser) {
      // E-Mail existiert bereits
      res.status(409).json({ message: 'Email already exists' });
    } else {
      // E-Mail ist verfügbar
      res.status(200).json({ message: 'Email is available' });
    }
  } catch (error) {
    console.error('Error checking email:', error);
    res.status(500).json({ message: 'Internal server error' });
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
    console.error('Fehler beim Abrufen des letzten Dienstplans:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen des letzten Dienstplans' });
  }
});

router.get('/all-schedules', async (req, res) => {
  try {
    const db = req.app.get('db');
    const schedules = await db.collection('schedules').find({}).sort({ generatedAt: -1 }).toArray();
    res.json(schedules);
  } catch (error) {
    console.error('Fehler beim Abrufen der Dienstpläne:', error);
    res.status(500).json({ error: 'Fehler beim Abrufen der Dienstpläne' });
  }
});

// ************** Login and Register **************

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  console.log('Empfangene Login-Daten:', email, password);
  res.json({ message: 'Loginversuch empfangen', status: 'success' });
});

router.get('/login/:value', (req, res, next) => {
  if (req.params.value === 'elias') {
      next();
  } else {
      res.status(403).send();
  }
}, (req, res) => {
  res.send('Success!');
});

// ************** Errors **************

router.use((req, res) => {
  res.status(404).send('404: Page not found');
});

export default router;