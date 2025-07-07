import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Signup from "./pages/Signup";
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signup" element={<Signup />} />
        {/* Add your other routes here, e.g. Login, Dashboard */}
      </Routes>
    </Router>
  );
}

export default App;
