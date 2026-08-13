import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Home from './pages/Home.jsx';
import TitleDetails from './pages/TitleDetails.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import ComingSoon from './pages/ComingSoon.jsx';
import NotFound from './pages/NotFound.jsx';

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/title/:mediaType/:id" element={<TitleDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/explore" element={<ComingSoon label="Explore" />} />
        <Route path="/vibe/:slug" element={<ComingSoon label="View All" />} />
        <Route path="/search" element={<ComingSoon label="Search" />} />
        <Route path="/watchlist" element={<ComingSoon label="My List" />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

export default App;
