import { BrowserRouter, Routes, Route } from "react-router-dom";
import Visualizer from "./Visualizer";
import Login from "./Login";
import Edgecase from "./Edgecase";

export default function App() {
  return (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Visualizer />} />
            <Route path="/login" element={<Login />} />
            <Route path="/hub" element={<Edgecase />} />
          </Routes>
        </BrowserRouter>
  );
}
