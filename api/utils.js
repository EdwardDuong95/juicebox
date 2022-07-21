const { user } = require("pg/lib/defaults");

  
  function requireActiveUser(req, res, next){
    if (!req.user || !req.user.active) {
      next({
        name: "NoActiveUserError",
        message: "You must be an active user to perform this action"
      });
    }
  }
   module.exports = {
    requireActiveUser
  }