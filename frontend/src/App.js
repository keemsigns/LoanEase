import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import ApplicationForm from "./pages/ApplicationForm";
import SuccessPage from "./pages/SuccessPage";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <div className="app-container">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/apply" element={<ApplicationForm />} />
          <Route path="/success" element={<SuccessPage />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" />
    </div>
  );
}

export default App;
