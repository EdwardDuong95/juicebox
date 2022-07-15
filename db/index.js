const { Client } = require("pg");
const { user } = require("pg/lib/defaults");

const client = new Client("postgres://localhost:5432/juicebox-dev");

async function getAllUsers() {
  const { rows } = await client.query(
    `SELECT id, username, name, location, active FROM users;`
  );

  return rows;
}

async function createUser({ username, password, name, location }) {
  try {
    const { rows } = await client.query(
      `INSERT INTO users(username, password, name, location)
       VALUES ($1, $2, $3, $4) 
       ON CONFLICT (username) DO NOTHING 
       RETURNING *;`,
      [username, password, name, location]
    );

    return rows;
  } catch (error) {
    throw error;
  }
}

async function updateUser(id, fields = {}) {
  const setString = Object.keys(fields)
    .map((key, index) => `"${key}" =$${index + 1}`)
    .join(", ");

  if (setString.length === 0) {
    return;
  }

  try {
    const { rows } = await client.query(
      `
            UPDATE users 
            SET ${setString}
            WHERE id=${id}
            RETURNING *;
        `,
      Object.values(fields)
    );

    return rows;
  } catch (error) {
    throw error;
  }
}

async function createPost({ authorId, title, content }) {
  try {
    const { rows } = await client.query(
      `INSERT INTO users('authorId', title, content)
           VALUES ($1, $2, $3)  
           RETURNING *;`,
      [authorId, title, content]
    );

    return rows;
  } catch (error) {
    throw error;
  }
}

async function updatePost(id, { title, content, active }) {
  try {
    const setString = `'title'=$1, 'content'=$2, 'active'=$3`;

    const { rows } = await client.query(
      `
        UPDATE posts 
        SET ${setString}
        WHERE id=${id}
        RETURNING *;`,
      [title, content, active]
    );

    return rows;
  } catch (error) {
    throw error;
  }
}

async function getAllPosts() {
  try {
    const { rows } = await client.query(
      `SELECT id, 'authorId', title, content, active FROM posts;`
    );

    return rows;
  } catch (error) {
    throw error;
  }
}

async function getPostsByUser(userId) {
    try {
        const { rows } = await client.query(`
        SELECT * FROM posts
        WHERE "authorId"=${ userId };`);  
        
        return rows;
    }   catch (error) {
        throw error;
    }
}

async function getUserById(userId) {
    try{
        const userQueryResult = await client.query(`SELECT * FROM users WHERE id=${ userId };`);
        if (userQueryResult.rows.length) {
            const user = queryResult.rows[0];
        } else {return null;}

      return {
          "id" : user.id,
          "username": user.username,
          "name": user.name,
          "location": user.location,
          "posts": getPostsByUser(user.id)
      }
    } catch (error){
        throw(error);
    }
}


module.exports = {
  client,
  getAllUsers,
  createUser,
  updateUser,
  createPost,
  updatePost,
  getAllPosts,
  getPostsByUser,
  getUserById
};
