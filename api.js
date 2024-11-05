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

// Update user weeklyHours
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


// ************** ADMIN ROUTES **************

router.post('/generate-schedule', async (req, res) => {
  const { workStartTime, workEndTime, workDays, users } = req.body;

  try {
    const db = req.app.get('db');
    const totalHoursPerDay = (new Date(`1970-01-01T${workEndTime}`) - new Date(`1970-01-01T${workStartTime}`)) / 3600000;
    const daysCount = workDays.length;

    const schedule = users.map(user => {
      const dailyHours = Math.min(user.weeklyHours / daysCount, totalHoursPerDay);
      return {
        user: user.username,
        schedule: workDays.map(day => ({
          day,
          start: workStartTime,
          end: workEndTime,
          hours: dailyHours
        }))
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


export default router;