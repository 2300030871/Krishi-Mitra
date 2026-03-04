const { updatePreferredLanguage, getChatUsers } = require('../services/userService');

const updateLanguage = async (req, res, next) => {
  try {
    const result = await updatePreferredLanguage({
      userId: req.user.id,
      language: req.body.language,
    });

    if (result.error) {
      return res.status(result.status || 400).json({ message: result.error });
    }

    return res.json(result.user);
  } catch (error) {
    return next(error);
  }
};

const getChatUserList = async (req, res, next) => {
  try {
    const users = await getChatUsers(req.user.id);
    return res.json(users);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  updateLanguage,
  getChatUserList,
};
