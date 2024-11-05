import express from 'express';
import { ObjectId } from 'mongodb';

const router = express.Router();

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


export default router;