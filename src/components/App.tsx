import { BrowserRouter, Routes, Route } from "react-router-dom";
import Visualizer from "../pages/Visualizer";

export default function App() {
  return (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Visualizer />} />
          </Routes>
        </BrowserRouter>
  );
}
