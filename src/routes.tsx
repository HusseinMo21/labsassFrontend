import { createBrowserRouter } from 'react-router-dom';
import App from './App';
import SignIn from './pages/auth/SignIn';
import Services from './components/Services';
import Contact from './components/Contact';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
  },
  {
    path: '/signin',
    element: <SignIn />,
  },
  {
    path: '/services',
    element: <Services />,
  },
  {
    path: '/contact',
    element: <Contact />,
  },
]);

export default router;