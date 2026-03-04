const User = require('../models/User');
const { toCanonicalLanguage } = require('../utils/language');

const languageOptions = new Set(['english', 'hindi', 'telugu']);

const updatePreferredLanguage = async ({ userId, language }) => {
  const normalized = toCanonicalLanguage(language, null);

  if (!languageOptions.has(normalized)) {
    return { error: 'Language must be one of: english, hindi, telugu.', status: 400 };
  }

  const user = await User.findByIdAndUpdate(
    userId,
    {
      preferredLanguage: normalized,
    },
    {
      new: true,
      runValidators: true,
    }
  ).select('-password');

  if (!user) {
    return { error: 'User not found.', status: 404 };
  }

  return { user };
};

const getChatUsers = async (currentUserId) => {
  return User.find({ _id: { $ne: currentUserId } })
    .select('name email role preferredLanguage')
    .sort({ name: 1 });
};

module.exports = {
  updatePreferredLanguage,
  getChatUsers,
};
