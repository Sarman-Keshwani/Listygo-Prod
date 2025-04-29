import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, User, Bell, Search, ChevronDown, Home, ShoppingBag, Briefcase } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

import {
  isAuthenticated,
  logoutUser,
  getCurrentUser,
} from "../services/authService";
import { Badge, Avatar, Input, Dropdown, Menu as AntMenu, Button, Tooltip, Spin } from "antd";

// API URL from environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [userAuthenticated, setUserAuthenticated] = useState(false);
  const [userData, setUserData] = useState(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if the current route matches a nav item
  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const response = await axios.get(`${API_URL}/categories`);
        setCategories(response.data.data || []);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Check authentication status when component mounts
  useEffect(() => {
    const checkAuth = () => {
      const authStatus = isAuthenticated();
      setUserAuthenticated(authStatus);

      if (authStatus) {
        const user = getCurrentUser();
        setUserData(user);
        
        // Check if user is admin
        if (user?.role === "admin" || user?.role === "super-admin") {
          setIsAdmin(true);
          
          // Store admin status in localStorage for persistence
          localStorage.setItem("isAdmin", "true");
        }
      } else {
        // Check if we have saved admin status
        const savedAdminStatus = localStorage.getItem("isAdmin");
        if (savedAdminStatus === "true") {
          setIsAdmin(true);
        }
      }
    };

    checkAuth();

    // Add event listener for storage changes (for multi-tab logout)
    window.addEventListener("storage", checkAuth);
    
    // Add scroll event listener for navbar styling
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleLogout = () => {
    logoutUser();
    setUserAuthenticated(false);
    setUserData(null);
    
    // Only clear admin status if explicitly logging out
    localStorage.removeItem("isAdmin");
    setIsAdmin(false);
    
    navigate("/");
  };

  const handleSearch = (value) => {
    if (value.trim()) {
      navigate(`/listings?search=${encodeURIComponent(value)}`);
      setSearchVisible(false);
    }
  };

  // User dropdown menu items
  const userMenuItems = (
    <AntMenu>
      <AntMenu.Item key="1" icon={<User size={14} />}>
        <Link to="/account">My Profile</Link>
      </AntMenu.Item>
      {isAdmin && (
        <AntMenu.Item key="2" icon={<Briefcase size={14} />}>
          <Link to="/admin/dashboard">Vendor Dashboard</Link>
        </AntMenu.Item>
      )}
      <AntMenu.Item key="3" icon={<LogOut size={14} />} danger onClick={handleLogout}>
        Log Out
      </AntMenu.Item>
    </AntMenu>
  );
  
  // Dynamic categories menu
  const categoryMenu = (
    <AntMenu>
      {loadingCategories ? (
        <AntMenu.Item disabled>
          <Spin size="small" /> Loading categories...
        </AntMenu.Item>
      ) : categories.length > 0 ? (
        categories.map(category => (
          <AntMenu.Item key={category._id} icon={<Home size={16} />}>
            <Link to={`/listings?category=${category._id}`}>
              {category.name}
            </Link>
          </AntMenu.Item>
        ))
      ) : (
        <AntMenu.Item disabled>
          No categories available
        </AntMenu.Item>
      )}
      <AntMenu.Divider />
      <AntMenu.Item key="all-categories">
        <Link to="/listings" className="text-blue-600 font-medium">
          View All Categories
        </Link>
      </AntMenu.Item>
    </AntMenu>
  );

  return (
    <>
      <nav className={`bg-white fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'shadow-md py-2' : 'shadow-sm py-3'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 z-10">
            <img src="/Logo.png" alt="ListyGo Logo" className="h-10 w-auto" />
            <span className={`text-xl font-bold text-blue-600 transition-all duration-300 ${
              scrolled ? 'text-blue-700' : 'text-blue-600'
            }`}>ListyGo</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-6 text-sm font-medium text-gray-700">
              <Link
                to="/"
                className={`transition duration-200 hover:text-blue-600 py-2 relative ${
                  isActive("/") ? "text-blue-600 font-semibold" : ""
                }`}
              >
                Home
                {isActive("/") && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                    layoutId="navbar-indicator"
                  />
                )}
              </Link>

              <Link
                to="/listings"
                className={`transition duration-200 hover:text-blue-600 py-2 relative ${
                  isActive("/listings") && !isActive("/listings/") ? "text-blue-600 font-semibold" : ""
                }`}
              >
                All Listings
                {isActive("/listings") && !isActive("/listings/") && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                    layoutId="navbar-indicator"
                  />
                )}
              </Link>
              
              {/* Dynamic Categories Dropdown */}
              <Dropdown
                overlay={categoryMenu}
                placement="bottomCenter"
              >
                <div className="cursor-pointer transition duration-200 hover:text-blue-600 py-2 relative flex items-center gap-1">
                  Categories <ChevronDown size={16} />
                </div>
              </Dropdown>

              <Link
                to="/about"
                className={`transition duration-200 hover:text-blue-600 py-2 relative ${
                  isActive("/about") ? "text-blue-600 font-semibold" : ""
                }`}
              >
                About Us
                {isActive("/about") && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                    layoutId="navbar-indicator"
                  />
                )}
              </Link>

              <Link
                to="/contact"
                className={`transition duration-200 hover:text-blue-600 py-2 relative ${
                  isActive("/contact") ? "text-blue-600 font-semibold" : ""
                }`}
              >
                Contact Us
                {isActive("/contact") && (
                  <motion.div
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                    layoutId="navbar-indicator"
                  />
                )}
              </Link>
              
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  className={`transition duration-200 hover:text-blue-600 py-2 relative ${
                    isActive("/admin") ? "text-blue-600 font-semibold" : ""
                  }`}
                >
                  Vendor Panel
                  {isActive("/admin") && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-full"
                      layoutId="navbar-indicator"
                    />
                  )}
                </Link>
              )}
            </div>

            {userAuthenticated ? (
              <div className="flex items-center gap-4">
                <Dropdown
                  overlay={userMenuItems}
                  placement="bottomRight"
                  trigger={["click"]}
                  overlayClassName="shadow-lg rounded-lg overflow-hidden"
                >
                  <div className="flex items-center gap-2 cursor-pointer">
                    <Avatar
                      size={32}
                      className="bg-blue-600"
                      src={userData?.avatar}
                    >
                      {userData?.name
                        ? userData.name.charAt(0).toUpperCase()
                        : "U"}
                    </Avatar>
                    <div className="hidden lg:block">
                      <div className="text-sm font-medium text-gray-800">
                        {userData?.name || "User"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {userData?.role === "admin" ? "Vendor" : userData?.role || "User"}
                      </div>
                    </div>
                    <ChevronDown size={16} className="text-gray-500" />
                  </div>
                </Dropdown>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                {/* Original user login/signup buttons */}
                <Link
                  to="/login"
                  className="text-blue-600 border border-blue-600 px-4 py-1.5 rounded-full hover:bg-blue-50 transition-colors text-sm font-medium"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 text-white px-4 py-1.5 rounded-full hover:bg-blue-700 transition-colors text-sm font-medium"
                >
                  Sign Up
                </Link>
                
                {/* Added vendor login option */}
                <Tooltip title="For business owners">
                  <Link
                    to="/admin/login"
                    className="text-gray-600 border border-gray-300 px-4 py-1.5 rounded-full hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
                  >
                    <Briefcase size={14} /> Vendor
                  </Link>
                </Tooltip>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            {isAdmin && (
              <Tooltip title="Vendor Dashboard">
                <Link
                  to="/admin/dashboard"
                  className="text-blue-600 hover:text-blue-800"
                >
                  <Badge status="processing" color="blue">
                    <Briefcase size={20} />
                  </Badge>
                </Link>
              </Tooltip>
            )}
            <button
              onClick={toggleMenu}
              className="text-gray-700 hover:text-blue-600 transition-colors"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden overflow-hidden bg-white shadow-lg"
            >
              <div className="px-6 py-4 flex flex-col gap-3 text-sm font-medium">
                {userAuthenticated && (
                  <div className="flex items-center gap-3 py-3 border-b border-gray-100">
                    <Avatar
                      size={40}
                      className="bg-blue-600"
                      src={userData?.avatar}
                    >
                      {userData?.name
                        ? userData.name.charAt(0).toUpperCase()
                        : "U"}
                    </Avatar>
                    <div>
                      <div className="font-semibold text-gray-800">
                        {userData?.name || "User"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {userData?.email || "user@example.com"}
                      </div>
                    </div>
                  </div>
                )}

                <Link
                  to="/"
                  className={`py-2 ${
                    isActive("/")
                      ? "text-blue-600 font-semibold"
                      : "text-gray-700"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  to="/listings"
                  className={`py-2 ${
                    isActive("/listings") && !isActive("/listings/")
                      ? "text-blue-600 font-semibold"
                      : "text-gray-700"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  All Listings
                </Link>
                
                {/* Dynamic categories in mobile menu */}
                <div className="py-2 text-gray-700">
                  <div className="mb-2 font-medium">Categories</div>
                  {loadingCategories ? (
                    <div className="flex justify-center py-2">
                      <Spin size="small" />
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 pl-2">
                      {categories.slice(0, 6).map((category) => (
                        <Link 
                          key={category._id}
                          to={`/listings?category=${category._id}`}
                          className="flex items-center gap-2 py-1 text-gray-600 hover:text-blue-600"
                          onClick={() => setMenuOpen(false)}
                        >
                          <Home size={14} /> {category.name}
                        </Link>
                      ))}
                      {categories.length > 6 && (
                        <Link
                          to="/listings"
                          className="flex items-center gap-2 py-1 text-blue-600 font-medium"
                          onClick={() => setMenuOpen(false)}
                        >
                          View All ({categories.length})
                        </Link>
                      )}
                    </div>
                  )}
                </div>
                
                <Link
                  to="/about"
                  className={`py-2 ${
                    isActive("/about")
                      ? "text-blue-600 font-semibold"
                      : "text-gray-700"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  About Us
                </Link>
                <Link
                  to="/contact"
                  className={`py-2 ${
                    isActive("/contact")
                      ? "text-blue-600 font-semibold"
                      : "text-gray-700"
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  Contact Us
                </Link>

                {userAuthenticated ? (
                  <>
                    <div className="h-px bg-gray-100 my-2"></div>
                    <Link
                      to="/account"
                      className="py-2 text-gray-700 flex items-center gap-2"
                      onClick={() => setMenuOpen(false)}
                    >
                      <User size={16} /> My Profile
                    </Link>
                    {isAdmin && (
                      <Link
                        to="/admin/dashboard"
                        className="py-2 text-blue-600 flex items-center gap-2 font-medium"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Briefcase size={16} /> Vendor Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        handleLogout();
                        setMenuOpen(false);
                      }}
                      className="py-2 text-red-500 flex items-center gap-2 w-full text-left"
                    >
                      <LogOut size={16} /> Log Out
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col gap-3 mt-3">
                    {/* Preserve standard login options in mobile menu */}
                    <Link
                      to="/login"
                      className="text-blue-600 border border-blue-600 px-4 py-2 rounded-full hover:bg-blue-50 text-center"
                      onClick={() => setMenuOpen(false)}
                    >
                      Log In
                    </Link>
                    <Link
                      to="/register"
                      className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 text-center"
                      onClick={() => setMenuOpen(false)}
                    >
                      Sign Up
                    </Link>
                    <div className="relative flex items-center py-2">
                      <div className="flex-grow border-t border-gray-200"></div>
                      <span className="flex-shrink mx-4 text-gray-400 text-xs">OR</span>
                      <div className="flex-grow border-t border-gray-200"></div>
                    </div>
                    <Link
                      to="/admin/login"
                      className="text-gray-600 border border-gray-300 px-4 py-2 rounded-full hover:bg-gray-50 text-center flex items-center justify-center gap-2"
                      onClick={() => setMenuOpen(false)}
                    >
                      <Briefcase size={16} /> Vendor Login
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Space to prevent content from being hidden under navbar */}
      <div className={`h-16 ${scrolled ? 'h-14' : 'h-16'}`}></div>
    </>
  );
};

export default Navbar;
