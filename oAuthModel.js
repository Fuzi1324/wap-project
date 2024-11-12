import bcrypt from 'bcrypt';

const client = {
    id: 'client',
    grants: ['password', 'refresh_token'],
  };
  
  export default function oAuthModel(db) {
    return {
      getClient() {
        return client; // we do not handle multiple clients, thus we always return the hardcoded one
      },
      async getAccessToken(accessToken) {
        const token = await db.collection('token').findOne({ accessToken });
        if (token) {
          token.client = client;
          token.user = await db.collection('user_auth').findOne({ _id: token.user_id });
        }
        return token;
      },
      async getRefreshToken(refreshToken) {
        const token = await db.collection('token').findOne({ refreshToken });
        if (token) {
          token.client = client;
          token.user = await db.collection('user_auth').findOne({ _id: token.user_id });
        }
        return token;
      },
      async getUser(username, password) {
        const user = await db.collection('user_auth').findOne({ username });
        if (user) {
          const passwordsMatch = await bcrypt.compare(password, user.password);
          if (passwordsMatch) return user;
        }
        return null;
      },
      async saveToken(token, client, user) {
        await db.collection('token').insertOne({ accessToken: token.accessToken, accessTokenExpiresAt: token.accessTokenExpiresAt, user_id: user._id });
        await db.collection('token').insertOne({ refreshToken: token.refreshToken, refreshTokenExpiresAt: token.refreshTokenExpiresAt, user_id: user._id });
        return { ...token, client, user };
      },
      async revokeToken(token) {
        const deleted = await db.collection('token').deleteOne({ refreshToken: token.refreshToken });
        return deleted.deletedCount === 1;
      }
    };
  }