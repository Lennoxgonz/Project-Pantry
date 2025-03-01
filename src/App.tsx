import { BrowserRouter, Route, Routes } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import PrivateRoute from "./components/PrivateRoute";
import Header from "./components/Header";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import ProjectPage from "./pages/ProjectPage";
import NewProjectPage from "./pages/NewProjectPage";
import ProjectsPage from "./pages/ProjectsPage";
import EditProjectPage from "./pages/EditProjectPage";
import InventoryPage from "./pages/InventoryPage";

function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/signin" element={<LoginPage />} />
        <Route path="/" element={<HomePage />} />

        <Route
          path="/projects"
          element={
            <PrivateRoute>
              <ProjectsPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/new"
          element={
            <PrivateRoute>
              <NewProjectPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <PrivateRoute>
              <ProjectPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:id/edit"
          element={
            <PrivateRoute>
              <EditProjectPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/inventory"
          element={
            <PrivateRoute>
              <InventoryPage />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
