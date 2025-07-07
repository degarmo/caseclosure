import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import './App.css';
import './assets/styles/tailwind.css';
import './assets/styles/index.css'
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import MemorialPage from "./pages/MemorialPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/memorial/:id" element={<MemorialPage />} />
      </Routes>
    </Router>
  );
}

export default App;
