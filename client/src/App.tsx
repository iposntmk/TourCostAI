import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { MasterDataProvider } from "./contexts/MasterDataContext";
import { TourProvider } from "./contexts/TourContext";
import { Dashboard } from "./pages/Dashboard/Dashboard";
import { MasterDataPage } from "./pages/MasterData/MasterDataPage";
import { NewTourPage } from "./pages/NewTour/NewTourPage";
import { TourDetailPage } from "./pages/TourDetail/TourDetailPage";
import "./App.css";

const NotFound = () => (
  <div className="page-wrapper">
    <div className="panel">
      <div className="panel-body">
        <h1>Không tìm thấy trang</h1>
        <p>Trang bạn đang tìm kiếm không tồn tại.</p>
      </div>
    </div>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <MasterDataProvider>
        <TourProvider>
          <AppLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/new" element={<NewTourPage />} />
              <Route path="/tour/:id" element={<TourDetailPage />} />
              <Route path="/master-data" element={<MasterDataPage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppLayout>
        </TourProvider>
      </MasterDataProvider>
    </BrowserRouter>
  );
}

export default App;
