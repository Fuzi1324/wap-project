import express from 'express';
import { v4 } from 'uuid';
import bcrypt from 'bcrypt';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const db = req.app.get('db');
    
    const existingUser = await db.collection('user_auth').findOne({ username: req.body.email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    const insertion = await db.collection('user_auth').insertOne({ username: req.body.email });
    if (insertion.acknowledged) {
      const token = v4();
      const tokenInsertion = await db.collection('token').insertOne({
        emailToken: token,
        emailTokenExpiresAt: new Date(Date.now() + (1000 * 60 * 60)),
        user_id: insertion.insertedId,
      });

      if (tokenInsertion.acknowledged) {
        console.log(`Activation link: http://localhost:3000/activate/${token}`);

        res.status(201).send();
      } else {
        res.status(500).send();
      }
    } else {
      res.status(500).send();
    }
  } catch(err) {
    console.error(err);
    res.status(500).send();
  }
});

router.put('/:token', async (req, res) => {
    try {
      const db = req.app.get('db');
  
      const token = await db.collection('token').findOne({ emailToken: req.params.token });
      if (token) {
        const insertion = await db.collection('user').insertOne({
          first_name: req.body.first_name,
          last_name: req.body.last_name,
          role: 'user',
          weeklyHours: 40,
          vacationPeriods: [],
          vacationDays: 25,
          organisation: null,
        });
  
        if (insertion.acknowledged) {
          const updated = await db.collection('user_auth').updateOne({ _id: token.user_id }, { $set: {
            password: await bcrypt.hash(req.body.password, 10),
            user_id: insertion.insertedId
          } });
          if (updated.modifiedCount === 1) {
            await db.collection('token').deleteOne({ emailToken: req.params.token });
            
            res.status(200).send();
          } else {
            res.status(500).send();
          }
        } else {
          res.status(500).send();
        }
      } else {
        res.status(401).send();
      }
    } catch(err) {
      console.error(err);
      res.status(500).send();
    }
  });

export default router;
