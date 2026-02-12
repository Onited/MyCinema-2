export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="brand-icon">🎬</span>
          <span>MyCinema</span>
        </div>
        <p className="footer-copy">© {new Date().getFullYear()} MyCinema — Projet Microservices</p>
      </div>
    </footer>
  );
}
