import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import './App.css';
import './assets/styles/tailwind.css';
import './assets/styles/index.css'
import Login from "./pages/Login";


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        {/* Add your other routes here, e.g. Login, Dashboard */}
      </Routes>
    </Router>
  );
}

export default App;
