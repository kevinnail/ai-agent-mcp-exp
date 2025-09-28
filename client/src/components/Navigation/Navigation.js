import { Link } from 'react-router-dom';
import './Navigation.css';

function Navigation() {
  return (
    <nav className="App-nav">
      <div className="nav-container">
        <Link to="/" className="nav-brand">
          Full-Stack Template
        </Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">
            Home
          </Link>
          <Link to="/api-test" className="nav-link">
            API Test
          </Link>

          <Link to="/auth-test" className="nav-link">
            Auth Test
          </Link>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
