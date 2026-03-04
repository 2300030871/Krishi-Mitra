const tiles = [
  {
    key: 'mandi',
    title: 'Mandi Prices',
    className: 'tile tile-mandi',
  },
  {
    key: 'schemes',
    title: 'Schemes',
    className: 'tile tile-schemes',
  },
  {
    key: 'farmer',
    title: 'Farmer Dashboard',
    className: 'tile tile-farmer',
  },
  {
    key: 'buyer',
    title: 'Buyer Dashboard',
    className: 'tile tile-buyer',
  },
];

export default function HomeTiles({ onNavigate }) {
  return (
    <div className="tile-grid">
      {tiles.map((tile) => (
        <button key={tile.key} className={tile.className} onClick={() => onNavigate(tile.key)}>
          {tile.title}
        </button>
      ))}
    </div>
  );
}
