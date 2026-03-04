const getWeather = async (req, res, next) => {
  try {
    const { lat, lon } = req.query;

    if (!lat || !lon) {
      return res.status(400).json({ message: 'Latitude and longitude are required.' });
    }

    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code`
    );

    if (!response.ok) {
      return res.status(502).json({ message: 'Weather provider request failed.' });
    }

    const payload = await response.json();
    return res.json(payload.current || {});
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getWeather,
};
