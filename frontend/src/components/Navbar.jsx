import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";
import { motion, AnimatePresence } from "framer-motion";
import { HiOutlineMenu, HiOutlineX } from 'react-icons/hi';

const Navbar = () => {
  const [scrolling, setScrolling] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const isReservationPage = location.pathname === '/Reservation';
  const isAdminPage = location.pathname === '/admin';
  const isRoomDetailsPage = location.pathname.startsWith('/room-details/');
  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(window.scrollY);

  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (currentScrollY <= 0) {
            setShowHeader(true);
          } else if (currentScrollY > lastScrollY.current) {
            setShowHeader(false); // scrolling down
          } else if (currentScrollY < lastScrollY.current) {
            setShowHeader(true); // scrolling up
          }
          lastScrollY.current = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error.message);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  const renderNavLinks = () => {
    if (isRoomDetailsPage) {
      return null;
    }

    if (isReservationPage) {
      return (
        <div className="hidden sm:flex sm:space-x-8">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNavigation("/Reservation")}
            className="text-white hover:text-[#F56A00] px-3 py-2 text-sm font-medium relative group"
          >
            Hotel Reservation
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#F56A00] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNavigation("/admin")}
            className="text-[#F56A00] hover:text-[#8B2500] px-3 py-2 text-sm font-medium relative group"
          >
            Admin
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#8B2500] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
          </motion.button>
        </div>
      );
    }

    return (
      <div className="hidden sm:flex sm:space-x-8">
        {[
          { path: "/Menu", label: "Menu" },
          { path: "/Catering", label: "Catering" },
          { path: "/PrivateDining", label: "PrivateDining" },
          { path: "/Events", label: "Events" },
          { path: "/AboutUs", label: "AboutUs" },
          { path: "/Reservation", label: "Hotel Reservation" }
        ].map((item) => (
          <motion.button
            key={item.path}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNavigation(item.path)}
            className="text-white hover:text-[#F56A00] px-3 py-2 text-sm font-medium relative group"
          >
            {item.label}
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#F56A00] transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></span>
          </motion.button>
        ))}
      </div>
    );
  };

  const renderMobileMenu = () => {
    if (isRoomDetailsPage) {
      return null;
    }

    if (isReservationPage) {
      return (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="sm:hidden"
        >
          <div className="space-y-1 px-2 pb-3 pt-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavigation("/Reservation")}
              className="text-white hover:text-[#F56A00] block px-3 py-2 text-base font-medium w-full text-left"
            >
              Hotel Reservation
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavigation("/admin")}
              className="text-[#F56A00] hover:text-[#8B2500] block px-3 py-2 text-base font-medium w-full text-left"
            >
              Admin
            </motion.button>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="sm:hidden"
      >
        <div className="space-y-1 px-2 pb-3 pt-2">
          {[
            { path: "/Menu", label: "Menu" },
            { path: "/Catering", label: "Catering" },
            { path: "/PrivateDining", label: "PrivateDining" },
            { path: "/Events", label: "Events" },
            { path: "/AboutUs", label: "AboutUs" },
            { path: "/Reservation", label: "Hotel Reservation" }
          ].map((item) => (
            <motion.button
              key={item.path}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleNavigation(item.path)}
              className="text-white hover:text-[#F56A00] block px-3 py-2 text-base font-medium w-full text-left"
            >
              {item.label}
            </motion.button>
          ))}
        </div>
      </motion.div>
    );
  };

  return (
    <div className={isAdminPage ? 'relative z-50' : ''}>
      <motion.nav
        initial={{ y: 0 }}
        animate={{ y: showHeader ? 0 : "-100%" }}
        transition={{ type: "tween", duration: 0.3 }}
        className="fixed top-0 left-0 right-0 z-50 bg-black/60"
      >
        <div className="container mx-auto flex justify-between items-center px-6 py-4">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleNavigation("/")}
          >
            <img
              src="/img-vid/logo.png"
              className="h-28 w-auto object-contain"
              alt="logo"
            />
          </motion.button>

          {isAdminPage && (
            <div className="flex items-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSignOut}
                className="font-bold text-lg text-[#F56A00] hover:text-[#8B2500] transition duration-300"
              >
                Sign Out
              </motion.button>
            </div>
          )}

          {!isAdminPage && !isRoomDetailsPage && (
            <button
              className="text-white text-4xl focus:outline-none z-50"
              onClick={() => setMenuOpen(true)}
              aria-label="Open menu"
            >
              <HiOutlineMenu />
            </button>
          )}
        </div>
      </motion.nav>

      <AnimatePresence>
        {menuOpen && !isAdminPage && !isRoomDetailsPage && (
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 right-0 h-full w-80 max-w-full bg-black/90 text-white z-[100] shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-6 border-b border-white/10">
             
              <button
                className="text-white text-3xl focus:outline-none"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                <HiOutlineX />
              </button>
            </div>
            <nav className="flex-1 flex flex-col gap-2 px-8 py-8">
              {[
                { path: "/Menu", label: "Menu" },
                { path: "/Catering", label: "Catering" },
                { path: "/PrivateDining", label: "Private Dining" },
                { path: "/Events", label: "Events" },
                { path: "/AboutUs", label: "About Us" },
                { path: "/Reservation", label: "Hotel Reservation" }
              ].map((item) => (
                <motion.button
                  key={item.path}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleNavigation(item.path)}
                  className="w-full text-left py-3 px-2 text-lg font-semibold rounded hover:bg-white/10 transition-colors duration-200"
                >
                  {item.label}
                </motion.button>
              ))}
            </nav>
          </motion.aside>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Navbar;
