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
      `INSERT INTO posts("authorId", title, content)
           VALUES ($1, $2, $3)  
           RETURNING *;`,
      [authorId, title, content]
    );

    return rows;
  } catch (error) {
    throw error;
  }
}

async function createTags(tagList) {
  if (tagList.length === 0) { 
    return; 
  }

// need something like: $1), ($2), ($3 
const insertValues = tagList.map(
  (_, index) => `$${index + 1}`).join('), (');
// then we can use: (${ insertValues }) in our string template

// need something like $1, $2, $3
const selectValues = tagList.map(
  (_, index) => `$${index + 1}`).join(', ');
// then we can use (${ selectValues }) in our string template

  
  const insertQueryString = `INSERT INTO tags(name)
    VALUES (${ insertValues })
    ON CONFLICT (name) DO NOTHING;`

  const selectQueryString = `SELECT * FROM tags
    WHERE name
    IN (${ selectValues });`
    console.log(selectQueryString)

  try {
    // insert the tags, doing nothing on conflict
    // returning nothing, we'll query after
    await client.query(insertQueryString, tagList)
    
    // select all tags where the name is in our taglist
    // return the rows from the query
    const { rows } = await client.query(selectQueryString, tagList)

    return rows;


  } catch (error) {
    throw error;
  }
}

async function createPostTag(postId, tagId) {
  try {
    await client.query(`
      INSERT INTO post_tags("postId", "tagId")
      VALUES ($1, $2)
      ON CONFLICT ("postId", "tagId") DO NOTHING;
    `, [postId, tagId]);
  } catch (error) {
    throw error;
  }
}

async function addTagsToPost(postId, tagList) {
  try {
    const createPostTagPromises = tagList.map(
      tag => createPostTag(postId, tag.id)
    );

    await Promise.all(createPostTagPromises);

    return await getPostById(postId);
  } catch (error) {
    throw error;
  }
}

async function getPostById(postId) {
  try {
    const { rows: [ post ]  } = await client.query(`
      SELECT *
      FROM posts
      WHERE id=$1;
    `, [postId]);

    const { rows: tags } = await client.query(`
      SELECT tags.*
      FROM tags
      JOIN post_tags ON tags.id=post_tags."tagId"
      WHERE post_tags."postId"=$1;
    `, [postId])

    const { rows: [author] } = await client.query(`
      SELECT id, username, name, location
      FROM users
      WHERE id=$1;
    `, [post.authorId])

    post.tags = tags;
    post.author = author;

    delete post.authorId;

    return post;
  } catch (error) {
    throw error;
  }
}

async function createInitialTags() {
  try {
    console.log("Starting to create tags...");

    const [happy, sad, inspo, catman] = await createTags([
      '#happy', 
      '#worst-day-ever', 
      '#youcandoanything',
      '#catmandoeverything'
    ]);

    const [postOne, postTwo, postThree] = await getAllPosts();

    await addTagsToPost(postOne.id, [happy, inspo]);
    await addTagsToPost(postTwo.id, [sad, inspo]);
    await addTagsToPost(postThree.id, [happy, catman, inspo]);

    console.log("Finished creating tags!");
  } catch (error) {
    console.log("Error creating tags!");
    throw error;
  }
}


async function updatePost(id, { title, content, active }) {
  try {
    if (active === null || active === undefined) {
      active = true;
    }
    const setString = `"title"=$1, "content"=$2, "active"=$3`;

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
      `SELECT id, "authorId", title, content, active FROM posts;`
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
        WHERE "authorId"=${userId};`);
    return rows;
  } catch (error) {
    throw error;
  }
}

async function getUserById(userId) {
  let user = {};
  try {
    const userQueryResult = await client.query(
      `SELECT * FROM users WHERE id=${userId};`
    );
    if (userQueryResult.rows.length) {
      user = userQueryResult.rows[0];
    } else {
      return null;
    }
    const posts = await getPostsByUser(user.id);

    return {
      id: user.id,
      username: user.username,
      name: user.name,
      location: user.location,
      posts: posts,
    };
  } catch (error) {
    throw error;
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
  getUserById,
  createTags,
  createInitialTags


};
