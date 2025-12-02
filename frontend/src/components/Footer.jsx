import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-column">
            <h3>Get to Know Us</h3>
            <div className="footer-links">
              <a href="#" className="footer-link">Careers</a>
              <a href="#" className="footer-link">About Us</a>
              <a href="#" className="footer-link">Investor Relations</a>
            </div>
          </div>
          <div className="footer-column">
            <h3>Make Money with Us</h3>
            <div className="footer-links">
              <a href="#" className="footer-link">Sell products</a>
              <a href="#" className="footer-link">Become an Affiliate</a>
              <a href="#" className="footer-link">Advertise Your Products</a>
            </div>
          </div>
          <div className="footer-column">
            <h3>Let Us Help You</h3>
            <div className="footer-links">
              <a href="#" className="footer-link">Your Account</a>
              <a href="#" className="footer-link">Returns</a>
              <a href="#" className="footer-link">Help</a>
            </div>
          </div>
          <div className="footer-column">
            <h3>Connect with Us</h3>
            <div className="footer-links">
              <a href="#" className="footer-link">Facebook</a>
              <a href="#" className="footer-link">Twitter</a>
              <a href="#" className="footer-link">Instagram</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-copyright">© 2024 ShopHub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
