import express from 'express';
import { ObjectId } from 'mongodb';

const router = express.Router();

async function writeAccess(req, res, next) {
  const db = req.app.get('db');
  // in authenticated middlewares (after `oauth.authenticate()`)
  // you will find the token in `res.locals.oauth.token`
  const user = await db.collection('user').findOne({ _id: res.locals?.oauth?.token?.user?.user_id });
  if (user?.permissions?.write) {
    res.locals.user = user; // we store a reference to the user object in `res.locals` for later use
    next();
  } else {
    res.status(403).send();
  }
}

// ************** USER ROUTES **************

router.get('/user', async (req, res) => {
    try {
      const db = req.app.get('db');
      const users = await db.collection('users').find({}).toArray();
  
      res.json(users);
    } catch(err) {
      console.error(err);
      res.status(500).send();
    }
});

router.post('/user', async (req, res) => {
    try {
      const db = req.app.get('db');
      const insertion = await db.collection('users').insertOne(req.body);
      if (insertion.acknowledged) {
        const user = await db.collection('users')
          .findOne({ _id: insertion.insertedId });
  
        if (user) {
          res.status(201).json(user);
        } else {
          res.status(404).send();
        }
      } else {
        res.status(500).send();
      }
    } catch(err) {
      console.error(err);
      res.status(500).send();
    }
});
  
router.get('/user/:id', async (req, res) => {
    try {
      const db = req.app.get('db');
      const user = await db.collection('users').findOne({ _id: new ObjectId(req.params.id) });
  
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

router.put('/user/:id', async (req, res) => {
    try {
      const db = req.app.get('db');
  
      const updateData = req.body;
      delete updateData._id;
  
      const updated = await db.collection('users')
        .updateOne({ _id: new ObjectId(req.params.id) }, { $set: updateData });
  
      if (updated.modifiedCount === 1) {
        const toDo = await db.collection('users')
          .findOne({ _id: new ObjectId(req.params.id) });
  
        if (toDo) {
          res.json(toDo);
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

router.delete('/user/:id', async (req, res) => {
    try {
      const db = req.app.get('db');
      const deleted = await db.collection('users')
        .deleteOne({ _id: new ObjectId(req.params.id) });
  
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

    const result = await db.collection('users').updateOne(
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
    const result = await db.collection('users').updateOne(
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
    const result = await db.collection('users').updateOne(
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