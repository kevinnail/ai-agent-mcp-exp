import './Navigation.css';
import { useUser } from '../../hooks/useUser.js';
import { signOutUser } from '../../services/fetch-auth.js';
import { toast } from 'react-toastify';

function Navigation() {
  const { user, setUser, setLoading } = useUser();

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOutUser();
      setUser(null);
      toast.success('Successfully signed out!');
      setLoading(false);
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error(`Sign out failed: ${error.message}`);
    }
  };
  return (
    <nav className="App-nav">
      <div className="nav-container">
        <h1 style={{ margin: '0', color: 'white' }}>
          AI Agent: weather | calculation | format input
        </h1>
        <div className="nav-links">
          {user && (
            <button onClick={handleSignOut} className="sign-out-btn">
              Sign Out
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
