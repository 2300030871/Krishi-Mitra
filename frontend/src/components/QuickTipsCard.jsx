const tips = [
  'Best practices for harvesting Kharif paddy (rice).',
  'Prepare your fields for Rabi season (wheat and mustard).',
  'Manage pest alerts early to avoid yield loss.',
];

export default function QuickTipsCard() {
  return (
    <div className="card tips-card">
      <h3>Quick Tips</h3>
      <ul>
        {tips.map((tip) => (
          <li key={tip}>{tip}</li>
        ))}
      </ul>
    </div>
  );
}
