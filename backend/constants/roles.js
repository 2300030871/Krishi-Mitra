const ROLES = Object.freeze({
  GUEST: 'guest',
  USER: 'user',
  EDITOR: 'editor',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
});

const ROLE_LEVEL = Object.freeze({
  [ROLES.GUEST]: 0,
  [ROLES.USER]: 1,
  [ROLES.EDITOR]: 2,
  [ROLES.ADMIN]: 3,
  [ROLES.SUPER_ADMIN]: 4,
});

const SYSTEM_ROLES = Object.freeze(Object.values(ROLES));

module.exports = {
  ROLES,
  ROLE_LEVEL,
  SYSTEM_ROLES,
};
