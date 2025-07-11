import Navbar from "./components/Navbar";
import HomePage from "./components/HomePage";
import Footer from "./components/Footer";
import AboutUs from "./components/AboutUs";
import Events from "./components/Events";
import PrivateDining from "./components/PrivateDining";
import { Routes, Route, useLocation } from "react-router-dom";
import Menu from "./components/Menu";
import Catering from "./components/Catering";
import Reservation from "./components/Reservation";
import RoomDetails from "./components/RoomDetails";
import AdminDashboard from "./components/AdminDashboard";
import TestSupabase from "./components/TestSupabase";
import TestCheckout from "./components/TestCheckout";
import Login from "./components/Login";
import { AuthProvider } from "./context/AuthContext";
import Confirmation from "./components/Confirmation";
import { useState, useEffect } from "react";

// ScrollToTop component
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [pathname]);
  return null;
}

function App() {
  const [showSplash, setShowSplash] = useState(false);
  const [hasSplashBeenShown, setHasSplashBeenShown] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (location.pathname === "/" && !sessionStorage.getItem("splashDismissed")) {
      setShowSplash(true);
    } else {
      setShowSplash(false);
    }
  }, [location.pathname]);
  const handleCloseSplash = () => {
    setShowSplash(false);
    sessionStorage.setItem("splashDismissed", "true");
  };
  return (
    <AuthProvider>
      <div className="overflow-x-hidden">
        {showSplash && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(44, 36, 28, 0.85)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <div style={{
              background: "#3b2415",
              borderRadius: "32px",
              padding: "2.8rem 2.2rem 2.2rem 2.2rem",
              boxShadow: "0 12px 48px rgba(0,0,0,0.45)",
              maxWidth: "95vw",
              width: "440px",
              textAlign: "center",
              position: "relative",
              border: "6px double #e7d3b1",
              outline: "4px solid #a67c52"
            }}>
              <button
                onClick={handleCloseSplash}
                style={{
                  position: "absolute",
                  top: 18,
                  right: 22,
                  background: "#e7d3b1",
                  border: "2px solid #a67c52",
                  borderRadius: "50%",
                  fontSize: "1.5rem",
                  color: "#8B2500",
                  width: 36,
                  height: 36,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.12)"
                }}
                aria-label="Close announcement"
              >
                ×
              </button>
              {/* Ribbon Banner */}
              <div style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "-1.5rem"
              }}>
                <div style={{
                  background: "linear-gradient(90deg, #e7d3b1 80%, #a67c52 100%)",
                  color: "#8B2500",
                  fontFamily: "'Cinzel', serif",
                  fontWeight: 700,
                  fontSize: "1.1rem",
                  letterSpacing: "2px",
                  padding: "0.5rem 2.5rem",
                  borderRadius: "18px 18px 0 0",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
                  borderBottom: "3px solid #a67c52",
                  marginBottom: "1.2rem"
                }}>
                  GRAND OPENING
                </div>
              </div>
              {/* Decorative Flourish */}
              <div style={{
                fontSize: "2.5rem",
                margin: "0.5rem 0 0.7rem 0",
                color: "#e7d3b1",
                textShadow: "0 2px 8px #2d1b0e, 0 0 2px #fff"
              }}></div>
              {/* Main Headline */}
              <div style={{
                fontFamily: "'Cinzel', serif",
                fontWeight: 900,
                fontSize: "2rem",
                color: "#fffbe8",
                letterSpacing: "1.5px",
                marginBottom: "0.7rem",
                textShadow: "2px 3px 0 #8B2500, 0 2px 12px #000"
              }}>
                Legends Bar & Grill Opening This Fall!
              </div>
              {/* Subheading */}
              <div style={{
                fontFamily: "'Merriweather', serif",
                fontSize: "1.13rem",
                color: "#e7d3b1",
                marginBottom: "1.2rem",
                textShadow: "0 1px 6px #2d1b0e"
              }}>
                Four HorseMen Hotel is now Legends Bar & Grill. Book your stay with us.<br />
                <a
                  href="/Reservation"
                  style={{
                    display: "inline-block",
                    margin: "0.5rem 0 0.5rem 0",
                    color: "#fffbe8",
                    background: "#a67c52",
                    padding: "0.4rem 1.2rem",
                    borderRadius: "18px",
                    fontWeight: 700,
                    fontFamily: "'Cinzel', serif",
                    fontSize: "1.05rem",
                    textDecoration: "none",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                    transition: "background 0.2s, color 0.2s"
                  }}
                  onMouseOver={e => { e.target.style.background = '#e7d3b1'; e.target.style.color = '#8B2500'; }}
                  onMouseOut={e => { e.target.style.background = '#a67c52'; e.target.style.color = '#fffbe8'; }}
                >
                  Book a Reservation
                </a><br />
                Stay tuned for grand opening details!
              </div>
              {/* Decorative Border/Flourish */}
              <div style={{
                margin: "1.2rem 0 0 0",
                color: "#e7d3b1",
                fontSize: "1.7rem",
                letterSpacing: "0.2em",
                textShadow: "0 1px 6px #2d1b0e"
              }}>
                ~ &#10070; ~
              </div>
            </div>
          </div>
        )}
        <Navbar className="flex flex-col min-h-screen"></Navbar>
        <div className="flex flex-col min-h-screen ">
          <ScrollToTop />
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
              <Route path="/confirmation" element={<Confirmation />}></Route>
            </Routes>
          </main>
          <Footer></Footer>
        </div>
      </div>
    </AuthProvider>
  );
}

export default App;
