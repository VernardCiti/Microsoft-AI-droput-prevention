// // src/App.jsx  
// import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';  
// import Login from './components/Login';  
// import Dashboard from './components/Dashboard';  
// import CrisisChat from './components/CrisisChat';  
// import CopilotWidget from './components/CopilotWidget';  

// function App() {  
//   return (  
//     <Router>  
//       <Routes>  
//         <Route path="/" element={<Login />} />  
//         <Route path="/dashboard" element={<Dashboard />} />  
//         <Route path="/crisis-chat" element={<CrisisChat />} />  
//         <Route path="/copilot" element={<CopilotWidget />} />  
//       </Routes>  
//     </Router>  
//   );  
// }  

// export default App;  
// src/App.js
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";        // Assume you create a login page
import Dashboard from "./views/Dashboard";
// import Dashboard from './components/Dashboard';  
import CrisisChat from "./components/CrisisChat";
import CopilotWidget from "./components/CopilotWidget";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/crisis-chat" element={<CrisisChat />} />
        <Route path="/copilot" element={<CopilotWidget />} />
      </Routes>
    </Router>
  );
}

export default App;
