import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Emission from "@/pages/Emission";
import Measures from "@/pages/Measures";
import Targets from "@/pages/Targets";
import Reports from "@/pages/Reports";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/emission" element={<Emission />} />
          <Route path="/measures" element={<Measures />} />
          <Route path="/targets" element={<Targets />} />
          <Route path="/reports" element={<Reports />} />
        </Route>
      </Routes>
    </Router>
  );
}
