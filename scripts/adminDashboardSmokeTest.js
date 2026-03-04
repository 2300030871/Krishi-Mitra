const API_BASE = process.env.API_BASE || 'http://localhost:5000/api';

const postJson = async (url, payload, token) => {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
};

const patchJson = async (url, payload, token) => {
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload || {}),
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
};

const deleteReq = async (url, token) => {
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
};

const getReq = async (url, token) => {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, data };
};

async function ensureBackend() {
  const health = await getReq(`${API_BASE}/health`);
  if (!health.ok) {
    throw new Error(`Backend health check failed: ${health.status}`);
  }
}

async function main() {
  await ensureBackend();

  const uniq = Date.now();
  const adminEmail = `admin.${uniq}@agrimandi.test`;
  const farmerEmail = `farmer.${uniq}@agrimandi.test`;
  const password = 'Test@12345';

  const adminReg = await postJson(`${API_BASE}/auth/register`, {
    name: 'Admin Smoke',
    email: adminEmail,
    password,
    role: 'admin',
  });
  if (!adminReg.ok) throw new Error(`Admin registration failed: ${JSON.stringify(adminReg)}`);

  const farmerReg = await postJson(`${API_BASE}/auth/register`, {
    name: 'Farmer Smoke 2',
    email: farmerEmail,
    password,
    role: 'farmer',
  });
  if (!farmerReg.ok) throw new Error(`Farmer registration failed: ${JSON.stringify(farmerReg)}`);

  const adminToken = adminReg.data.token;
  const farmerId = farmerReg.data.user.id;

  const createNews = await postJson(
    `${API_BASE}/admin/news`,
    {
      title: 'Admin Smoke News',
      content: 'News content for admin smoke test',
      image: 'https://example.com/news.jpg',
    },
    adminToken
  );

  const createScheme = await postJson(
    `${API_BASE}/admin/schemes`,
    {
      title: 'Admin Smoke Scheme',
      description: 'Scheme description for smoke test',
      eligibility: 'All small farmers',
      link: 'https://example.com/scheme',
    },
    adminToken
  );

  const usersBefore = await getReq(`${API_BASE}/admin/users`, adminToken);
  const deactivateFarmer = await patchJson(`${API_BASE}/admin/users/${farmerId}/deactivate`, {}, adminToken);
  const farmerLoginAfterDeactivate = await postJson(`${API_BASE}/auth/login`, {
    email: farmerEmail,
    password,
  });

  const publicNews = await getReq(`${API_BASE}/news`);
  const publicSchemes = await getReq(`${API_BASE}/schemes`);

  const deleteNews = createNews.ok
    ? await deleteReq(`${API_BASE}/admin/news/${createNews.data._id}`, adminToken)
    : { ok: false, status: 0 };

  const deleteScheme = createScheme.ok
    ? await deleteReq(`${API_BASE}/admin/schemes/${createScheme.data._id}`, adminToken)
    : { ok: false, status: 0 };

  const deleteFarmer = await deleteReq(`${API_BASE}/admin/users/${farmerId}`, adminToken);

  const summary = {
    createNews: { ok: createNews.ok, status: createNews.status },
    createScheme: { ok: createScheme.ok, status: createScheme.status },
    usersEndpoint: {
      ok: usersBefore.ok,
      status: usersBefore.status,
      count: Array.isArray(usersBefore.data) ? usersBefore.data.length : 0,
    },
    deactivateFarmer: { ok: deactivateFarmer.ok, status: deactivateFarmer.status, isActive: deactivateFarmer.data?.isActive },
    loginBlockedAfterDeactivate: {
      ok: !farmerLoginAfterDeactivate.ok,
      status: farmerLoginAfterDeactivate.status,
      message: farmerLoginAfterDeactivate.data?.message,
    },
    publicNews: {
      ok: publicNews.ok,
      status: publicNews.status,
      hasNews: Array.isArray(publicNews.data) && publicNews.data.some((n) => n.title === 'Admin Smoke News'),
    },
    publicSchemes: {
      ok: publicSchemes.ok,
      status: publicSchemes.status,
      hasScheme: Array.isArray(publicSchemes.data) && publicSchemes.data.some((s) => s.title === 'Admin Smoke Scheme'),
    },
    cleanup: {
      deleteNews: deleteNews.ok,
      deleteScheme: deleteScheme.ok,
      deleteFarmer: deleteFarmer.ok,
    },
  };

  console.log(JSON.stringify(summary, null, 2));

  const passed =
    createNews.ok &&
    createScheme.ok &&
    usersBefore.ok &&
    deactivateFarmer.ok &&
    !farmerLoginAfterDeactivate.ok &&
    publicNews.ok &&
    publicSchemes.ok;

  if (!passed) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Admin smoke test failed:', error.message || error);
  process.exit(1);
});
