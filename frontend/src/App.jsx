import Navbar from "./components/Navbar";
import HomePage from "./components/HomePage";
import Footer from "./components/Footer";
import AboutUs from "./components/AboutUs";
import Events from "./components/Events";
import PrivateDining from "./components/PrivateDining";
import { Routes, Route } from "react-router-dom";
import Menu from "./components/Menu";
import Catering from "./components/Catering";
import Reservation from "./components/Reservation";
import RoomDetails from "./components/RoomDetails";
import AdminDashboard from "./components/AdminDashboard";
import TestSupabase from "./components/TestSupabase";
import TestCheckout from "./components/TestCheckout";
import Login from "./components/Login";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <div>
        <Navbar className="flex flex-col min-h-screen"></Navbar>
        <div className="flex flex-col min-h-screen">
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage></HomePage>}></Route>
              <Route path="/Menu" element={<Menu></Menu>}></Route>
              <Route path="/Catering" element={<Catering></Catering>}></Route>
              <Route
                path="/PrivateDining"
                element={<PrivateDining></PrivateDining>}
              ></Route>
              <Route path="/Events" element={<Events></Events>}></Route>
              <Route path="/AboutUs" element={<AboutUs></AboutUs>}></Route>
              <Route path="/Reservation" element={<Reservation></Reservation>}></Route>
              <Route path="/room-details/:roomId" element={<RoomDetails />}></Route>
              <Route path="/admin" element={<AdminDashboard />}></Route>
              <Route path="/test-supabase" element={<TestSupabase />}></Route>
              <Route path="/test-checkout" element={<TestCheckout />}></Route>
              <Route path="/login" element={<Login />}></Route>
            </Routes>
          </main>
          <Footer></Footer>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;
