// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, Statistic, Row, Col, Button, Table, Tag, Avatar, Select, Dropdown, Menu, Typography, message, Spin, Empty, Tooltip, Input } from 'antd';
import { FiUser, FiHome, FiActivity, FiLayers, FiList, FiGrid, FiPlus, FiLayout, FiMoreVertical, FiMenu, FiRefreshCw, FiAlertCircle, FiBarChart2, FiCoffee, FiBriefcase, FiShoppingBag, FiFilm, FiStar, FiHeart, FiBookOpen, FiMap, FiTool } from 'react-icons/fi';
import { fetchAdminData } from '../services/adminService';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LayoutEditor } from './LayoutEditor';
import { useMediaQuery } from 'react-responsive';

const { Option } = Select;
const { Text } = Typography;
const API_URL = import.meta.env.VITE_API_URL || 'https://api.pathsuchi.com/api';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [layoutData, setLayoutData] = useState({
    large1: "",
    large2: "",
    small1: "",
    small2: "",
    small3: ""
  });
  const [showLayoutEditor, setShowLayoutEditor] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [recentListings, setRecentListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [categoryStats, setCategoryStats] = useState({});
  const [filteredCategories, setFilteredCategories] = useState([]);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');

  // Icon mapping for different category types (extend as needed)
  const categoryIcons = {
    "restaurant": <FiCoffee className="w-full h-full p-2 text-white" />,
    "hotel": <FiBriefcase className="w-full h-full p-2 text-white" />,
    "gym": <FiActivity className="w-full h-full p-2 text-white" />,
    "shop": <FiShoppingBag className="w-full h-full p-2 text-white" />,
    "entertainment": <FiFilm className="w-full h-full p-2 text-white" />,
    "beauty": <FiStar className="w-full h-full p-2 text-white" />,
    "health": <FiHeart className="w-full h-full p-2 text-white" />,
    "education": <FiBookOpen className="w-full h-full p-2 text-white" />,
    "travel": <FiMap className="w-full h-full p-2 text-white" />,
    "property": <FiHome className="w-full h-full p-2 text-white" />,
    "service": <FiTool className="w-full h-full p-2 text-white" />,
    "default": <FiGrid className="w-full h-full p-2 text-white" />
  };

  // Responsive breakpoints
  const isMobile = useMediaQuery({ maxWidth: 767 });
  const isTablet = useMediaQuery({ minWidth: 768, maxWidth: 1023 });
  const isDesktop = useMediaQuery({ minWidth: 1024 });

  const navigate = useNavigate();
  
  // Motion animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 12 }
    }
  };


  const [totalCount, setTotalCount] = useState(0);
  const [listingsCount, setListingsCount] = useState(0);

  // Function to fetch categories with enhanced data
  const fetchCategories = useCallback(async () => {
    try {
      setCategoriesLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        const categoriesData = response.data.data || [];
        
        // Get listing counts for each category 
        // This could be optimized with a backend endpoint that returns counts directly
        const categoryStatsData = {};
        
        try {
          // Get counts for each category
          const countPromises = categoriesData.map(async (category) => {
            try {
              const listingsResponse = await axios.get(
                `${API_URL}/listings?category=${category._id}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
              );
              // console.log(listingsResponse,"DA")
              
              // setListingsCount(listingsResponse?.data?.totalCount);
              return {
                id: category._id,
                count: listingsResponse.data.pagination?.total || 0
              };
            } catch (err) {
              console.error(`Error fetching count for category ${category.name}:`, err);
              return { id: category._id, count: 0 };
            }
          });
          
          const results = await Promise.all(countPromises);
          results.forEach(result => {
            categoryStatsData[result.id] = { listingsCount: result.count };
          });
          
          setCategoryStats(categoryStatsData);
        } catch (countError) {
          console.error('Error fetching category statistics:', countError);
        }
        
        // Set categories data
        setCategories(categoriesData);
        setFilteredCategories(categoriesData);
        return categoriesData;
      }
      return [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      message.error('Failed to load categories');
      setError('Failed to load categories');
      return [];
    } finally {
      setCategoriesLoading(false);
    }
  }, [API_URL]);

  const fetchLayoutData = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/layout`, {
        withCredentials: true
      });
      if (response.data.success) {
        setLayoutData(response.data.data);
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error('Error fetching layout data:', error);
      message.error('Failed to load layout configuration');
      return null;
    }
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/admin/login');
        return null;
      }
      
      // Fetch listings count directly if the adminData doesn't have it
      let listingsCount = 0;
      let data = await fetchAdminData();
      
      // If adminData doesn't have listing count or it's 0, fetch it directly
      if (!data?.totalListings && !data?.stats?.totalListings) {
        try {
          const listingsResponse = await axios.get(`${API_URL}/listings?limit=1`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          listingsCount = listingsResponse.data.pagination?.total || 40; // Use pagination total or fallback to 40
          
          
          setListingsCount(listingsResponse?.data?.totalCount);
        } catch (error) {
          console.error("Error fetching listings count:", error);
          listingsCount = 40; // Fallback count
        }
      }
      
      // Handle the case where data might have different structures
      if (data) {
        // Ensure consistent data structure
        const processedData = {
          ...data,
          totalListings: data.totalListings || data.stats?.totalListings || listingsCount || 0,
          totalUsers: data.totalUsers || data.stats?.totalUsers || 0,
          recentUsers: data.recentUsers || [],
          recentListings: data.recentListings || []
        };
        
        setAdminData(processedData);
        return processedData;
      }
      return null;
    } catch (error) {
      console.error("Failed to fetch admin data", error);
      message.error('Failed to load dashboard data');
      setError('Failed to load dashboard data');
      return null;
    }
  }, [navigate]);

  const fetchRecentListings = useCallback(async () => {
    try {
      setListingsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) return;
      
      // Fetch the 10 most recent listings with specific sorting and pagination
      const response = await axios.get(`${API_URL}/listings`, {
        params: {
          limit: 10,
          sort: '-createdAt', // Sort by newest first
          page: 1
        },
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setRecentListings(response.data.data || []);
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error('Error fetching recent listings:', error);
      message.error('Failed to load recent listings');
      return [];
    } finally {
      setListingsLoading(false);
    }
  }, []);

  const loadAllData = useCallback(async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      // Fetch all data in parallel for better performance
      const [categoriesData, dashboardData, layoutConfigData, recentListingsData] = await Promise.all([
        fetchCategories(),
        fetchDashboardData(),
        fetchLayoutData(),
        fetchRecentListings()
      ]);
      
      // Check if all essential data was loaded
      if (!dashboardData) {
        throw new Error('Failed to load dashboard data');
      }
      
      // Update last updated timestamp
      setLastUpdated(new Date());
      
      if (isRefreshing) {
        message.success('Dashboard data refreshed!');
      }
    } catch (error) {
      console.error("Error loading dashboard:", error);
      setError(error.message || 'Failed to load dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchCategories, fetchDashboardData, fetchLayoutData, fetchRecentListings]);

  // Function to handle category search/filter
  const handleCategorySearch = useCallback((search) => {
    setCategorySearchTerm(search);
    if (!search) {
      setFilteredCategories(categories);
      return;
    }
    
    const filtered = categories.filter(
      cat => cat.name.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredCategories(filtered);
  }, [categories]);

  // Helper to get appropriate icon for category
  const getCategoryIcon = (category) => {
    if (!category || !category.icon) return categoryIcons.default;
    
    // Try to match the icon name to our mapping
    const iconKey = Object.keys(categoryIcons).find(
      key => category.name.toLowerCase().includes(key) || 
             (category.icon && category.icon.toLowerCase().includes(key))
    );
    
    return iconKey ? categoryIcons[iconKey] : categoryIcons.default;
  };

  // Initial data load
  useEffect(() => {
    loadAllData();
    
    // Set up interval for periodic refresh (every 5 minutes)
    const refreshInterval = setInterval(() => {
      loadAllData(true);
    }, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [loadAllData]);

  // Manual refresh handler
  const handleRefresh = () => {
    loadAllData(true);
  };

  // Loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="flex flex-col items-center bg-white p-8 rounded-lg shadow-lg">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mb-4"></div>
          <p className="text-xl text-blue-700 font-semibold">Loading Dashboard...</p>
          <p className="text-gray-500 mt-2">Preparing your admin overview</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex items-center justify-center text-red-500 mb-4">
            <FiAlertCircle size={48} />
          </div>
          <h2 className="text-2xl font-bold text-center text-gray-800 mb-2">Dashboard Error</h2>
          <p className="text-gray-600 text-center mb-6">{error}</p>
          <div className="flex justify-center">
            <Button 
              type="primary" 
              onClick={handleRefresh}
              icon={<FiRefreshCw />}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Dropdown menu for mobile actions
  const actionsMenu = (
    <Menu>
      <Menu.Item key="1" icon={<FiLayers />} onClick={() => navigate("/admin/categories")}>
        Manage Categories
      </Menu.Item>
      <Menu.Item key="2" icon={<FiList />} onClick={() => navigate("/admin/listings")}>
        Manage Listings
      </Menu.Item>
      <Menu.Item key="3" icon={<FiLayout />} onClick={() => setShowLayoutEditor(!showLayoutEditor)}>
        {showLayoutEditor ? "Hide Layout Editor" : "Edit Layout"}
      </Menu.Item>
      <Menu.Item key="4" icon={<FiRefreshCw />} onClick={handleRefresh}>
        Refresh Data
      </Menu.Item>
    </Menu>
  );

  // Columns for Recent Users table - responsive columns
  const userColumns = [
    {
      title: 'User Name',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <div className="flex items-center">
          <Avatar 
            src={record.profilePicture} 
            className="mr-2 bg-blue-100"
          >
            {text?.charAt(0)?.toUpperCase() || 'U'}
          </Avatar>
          <span className="text-blue-600 font-medium hover:underline cursor-pointer">{text}</span>
        </div>
      )
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      responsive: ['md'] // Hide on mobile
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : status === 'pending' ? 'orange' : 'default'}>
          {status || 'active'}
        </Tag>
      ),
      responsive: ['lg'] // Hide on mobile and tablet
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
      responsive: ['sm'] // Hide on xs screens
    }
  ];

  // Columns for Recent Listings table - responsive columns
  const listingColumns = [
    {
      title: 'Listing',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div className="flex items-center space-x-3">
          {record.images && record.images.length > 0 ? (
            <Avatar shape="square" size={isMobile ? 32 : 48} src={record.images[0]} />
          ) : (
            <Avatar shape="square" size={isMobile ? 32 : 48} icon={<FiHome />} className="bg-blue-100" />
          )}
          <Tooltip title={name}>
            <span className={`text-blue-600 font-medium hover:underline cursor-pointer ${isMobile ? 'text-xs' : ''}`}>{
              isMobile && name.length > 12 ? name.substring(0, 12) + '...' : 
              isTablet && name.length > 20 ? name.substring(0, 20) + '...' : 
              name
            }</span>
          </Tooltip>
        </div>
      ),
      width: isMobile ? 150 : 250
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => (
        <Tag color="green">{
          category?.name?.length > 15 && isMobile ? 
          category.name.substring(0, 15) + '...' : 
          category?.name || 'Uncategorized'
        }</Tag>
      ),
      responsive: ['sm'] // Show on small screens and above
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      responsive: ['md'] // Show on medium screens and above
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price) => <span className="font-semibold">₹{price || 0}</span>,
      responsive: ['sm'] // Show on small screens and above
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => (
        <div className="flex items-center">
          <span className="text-yellow-500 mr-1">★</span>
          <span>{rating || 'N/A'}</span>
        </div>
      ),
      responsive: ['md'] // Only show on medium screens and above
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : status === 'pending' ? 'orange' : 'red'}>
          {status || 'active'}
        </Tag>
      ),
      responsive: ['sm'] // Show on small screens and above
    },
    {
      title: 'Added',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'N/A',
      responsive: ['lg'] // Only show on large screens
    }
  ];

  const renderEmptyState = (message) => (
    <Empty
      description={message}
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      className="my-8"
    />
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-3 md:p-6 bg-gradient-to-br from-blue-50 to-indigo-50 min-h-screen"
    >
      {/* Header section - Responsive design for different screen sizes */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <div className="flex items-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mr-2">Admin Dashboard</h1>
          {lastUpdated && (
            <Tooltip title={`Last updated: ${lastUpdated.toLocaleString()}`}>
              <span className="text-xs text-gray-500 bg-white/70 px-2 py-1 rounded-full">
                {refreshing ? 'Updating...' : `Updated: ${lastUpdated.toLocaleTimeString()}`}
              </span>
            </Tooltip>
          )}
        </div>
        
        {/* Desktop buttons */}
        <div className="hidden md:flex gap-3">
          <Button 
            type="primary" 
            icon={<FiLayers />}
            onClick={() => navigate("/admin/categories")}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            Manage Categories
          </Button>
          <Button 
            type="primary" 
            icon={<FiList />}
            onClick={() => navigate("/admin/listings")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Manage Listings
          </Button>
          <Button 
            type="primary" 
            icon={<FiLayout />}
            onClick={() => setShowLayoutEditor(!showLayoutEditor)}
            className="bg-green-600 hover:bg-green-700"
          >
            {showLayoutEditor ? "Hide Layout Editor" : "Edit Layout"}
          </Button>
          <Button 
            icon={<FiRefreshCw />} 
            onClick={handleRefresh}
            loading={refreshing}
            className="hover:bg-gray-100"
          >
            Refresh
          </Button>
        </div>
        
        {/* Mobile/Tablet action buttons */}
        <div className="flex md:hidden w-full sm:w-auto gap-2">
          <Button 
            type="primary"
            onClick={() => navigate("/admin/listings")}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-center"
            icon={<FiList />}
          >
            Listings
          </Button>
          <Button 
            type="primary"
            onClick={() => navigate("/admin/categories")}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-center"
            icon={<FiLayers />}
          >
            Categories
          </Button>
          <Button
            icon={<FiRefreshCw />}
            onClick={handleRefresh}
            loading={refreshing}
            className="flex-none"
          />
          <Dropdown overlay={actionsMenu} trigger={['click']} placement="bottomRight">
            <Button icon={<FiMenu />} className="flex-none">
              More
            </Button>
          </Dropdown>
        </div>
      </div>

      {/* Layout Editor - Full width and responsive */}
      {showLayoutEditor && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="mb-6 overflow-x-auto"
        >
          <Card className="shadow-lg border-blue-100">
            <LayoutEditor 
              boxData={layoutData} 
              onUpdate={fetchLayoutData} 
            />
          </Card>
        </motion.div>
      )}

      {refreshing && (
        <div className="w-full mb-6 flex justify-center">
          <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-full flex items-center">
            <Spin className="mr-2" />
            <span>Refreshing dashboard data...</span>
          </div>
        </div>
      )}

      {/* Stats Cards - Responsive grid with adjusted spacing */}
      <Row gutter={[{ xs: 8, sm: 16 }, { xs: 8, sm: 16 }]}>
        <Col xs={24} sm={12} md={8} lg={6}>
          <motion.div variants={itemVariants}>
            <Card 
              bordered={false} 
              className="shadow-md bg-white hover:shadow-lg transition-shadow overflow-hidden"
              bodyStyle={{ padding: '20px' }}
            >
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-blue-100 opacity-50" />
              <Statistic 
                title={<span className="text-gray-600 font-semibold">Total Users</span>}
                value={adminData?.totalUsers || 0} 
                prefix={<FiUser className="text-blue-600 mr-2" />} 
                valueStyle={{ color: '#1d4ed8', fontWeight: 'bold' }}
              />
              <div className="text-xs text-gray-500 mt-2">
                {adminData?.recentUsers?.length > 0 ? 
                  `+${adminData?.recentUsers?.length || 0} new in last 7 days` : 
                  'No new users recently'}
              </div>
            </Card>
          </motion.div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <motion.div variants={itemVariants}>
            <Card 
              bordered={false} 
              className="shadow-md bg-white hover:shadow-lg transition-shadow overflow-hidden"
              bodyStyle={{ padding: '20px' }}
            >
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-green-100 opacity-50" />
              <Statistic 
                title={<span className="text-gray-600 font-semibold">Total Listings</span>}
                value={listingsCount} 
                prefix={<FiHome className="text-green-600 mr-2" />} 
                valueStyle={{ color: '#15803d', fontWeight: 'bold' }}
              />
              <div className="text-xs text-gray-500 mt-2">
                {adminData?.recentListings?.length > 0 ? 
                  `+${adminData?.recentListings?.length || 0} new in last 7 days` : 
                  'No new listings recently'}
              </div>
            </Card>
          </motion.div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
          <motion.div variants={itemVariants}>
            <Card 
              bordered={false} 
              className="shadow-md bg-white hover:shadow-lg transition-shadow overflow-hidden"
              bodyStyle={{ padding: '20px' }}
            >
              <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-purple-100 opacity-50" />
              <Statistic 
                title={<span className="text-gray-600 font-semibold">Categories</span>}
                value={categories?.length || 0} 
                prefix={<FiGrid className="text-purple-600 mr-2" />}
                valueStyle={{ color: '#7e22ce', fontWeight: 'bold' }}
              />
              <div className="text-xs text-gray-500 mt-2">
                {'Manage your listing categories'}
              </div>
            </Card>
          </motion.div>
        </Col>
        <Col xs={24} sm={12} md={8} lg={6}>
        </Col>
      </Row>

      {/* Categories Section - Enhanced with better UI */}
      <motion.div variants={itemVariants} className="mt-6 md:mt-10">
        <Card 
          title={
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <FiGrid className="mr-2 text-blue-600" />
                <h2 className="text-lg md:text-xl font-semibold text-gray-800">Categories</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="primary"
                  icon={<FiPlus />}
                  onClick={() => navigate('/admin/categories')}
                  className="hidden sm:flex bg-indigo-600 hover:bg-indigo-700"
                >
                  New Category
                </Button>
                <Button 
                  type="link" 
                  onClick={() => navigate('/admin/categories')} 
                  className="p-0 flex items-center"
                >
                  View All <span className="ml-1">→</span>
                </Button>
              </div>
            </div>
          }
          bordered={false}
          className="shadow-md bg-white"
          loading={refreshing}
          extra={
            <div className="flex flex-col sm:flex-row gap-2 mb-4 sm:mb-0">
              <Button
                icon={<FiRefreshCw />}
                onClick={fetchCategories}
                loading={categoriesLoading}
                size="small"
                className="mr-2"
              >
                Refresh
              </Button>
              <Input.Search
                placeholder="Search categories"
                allowClear
                onSearch={handleCategorySearch}
                onChange={(e) => {
                  if (!e.target.value) {
                    handleCategorySearch('');
                  }
                }}
                style={{ width: isMobile ? '100%' : 200 }}
                size="small"
              />
            </div>
          }
        >
          {categoriesLoading ? (
            <div className="flex justify-center items-center py-8">
              <Spin size="large" />
            </div>
          ) : filteredCategories.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
              {filteredCategories.slice(0, isMobile ? 6 : isTablet ? 9 : 12).map(category => (
                <motion.div
                  key={category._id}
                  whileHover={{ scale: 1.03, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card 
                    className="border border-blue-100 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => navigate(`/admin/listings?category=${category._id}`)}
                    size="small"
                    bodyStyle={{ padding: isMobile ? '12px 8px' : '16px 12px' }}
                    hoverable
                  >
                    <div className="flex flex-col items-center py-1">
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center mb-2 sm:mb-3 shadow-md`}>
                        {getCategoryIcon(category)}
                      </div>
                      <h3 className={`font-medium text-gray-800 text-center ${isMobile ? 'text-xs' : 'text-sm md:text-base'} truncate w-full mb-1`}>
                        {category.name}
                      </h3>
                      {/* <div className={`${isMobile ? 'text-xs' : 'text-sm'} text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full`}>
                        {categoryStats[category._id]?.listingsCount || 0} listings
                      </div> */}
                      {!isMobile && category.description && (
                        <Tooltip title={category.description}>
                          <div className="text-xs text-gray-500 mt-2 truncate w-full text-center">
                            {category.description.length > (isTablet ? 15 : 20)
                              ? category.description.substring(0, isTablet ? 15 : 20) + '...' 
                              : category.description}
                          </div>
                        </Tooltip>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
              <motion.div
                whileHover={{ scale: 1.03, y: -5 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.2 }}
              >
                <Card 
                  className="border-2 border-dashed border-blue-300 hover:border-blue-500 hover:shadow-lg transition-all h-full bg-blue-50/50"
                  onClick={() => navigate('/admin/categories')}
                  size="small"
                  hoverable
                  bodyStyle={{ padding: isMobile ? '12px 8px' : '16px 12px' }}
                >
                  <div className="flex flex-col items-center justify-center h-full py-2 sm:py-4">
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center mb-2 sm:mb-3 shadow-md`}>
                      <FiPlus className={`w-full h-full ${isMobile ? 'p-2' : 'p-3'} text-white`} />
                    </div>
                    <p className={`text-blue-600 font-medium ${isMobile ? 'text-xs' : 'text-sm md:text-base'}`}>Add New Category</p>
                    {!isMobile && <p className="text-xs text-gray-500 mt-1">Create a category</p>}
                  </div>
                </Card>
              </motion.div>
            </div>
          ) : categorySearchTerm ? (
            <div className="py-8 text-center">
              <Empty 
                description={
                  <div>
                    <p className="text-lg text-gray-500 mb-2">No categories found</p>
                    <p className="text-sm text-gray-400">Try a different search term</p>
                  </div>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
              <Button 
                onClick={() => handleCategorySearch('')}
                className="mt-4"
              >
                Clear Search
              </Button>
            </div>
          ) : (
            <div className="py-8 text-center">
              <Empty 
                description={
                  <div>
                    <p className="text-lg text-gray-500 mb-3">No categories found</p>
                    <p className="text-sm text-gray-400 mb-4">Categories help organize your listings</p>
                  </div>
                }
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
              <Button
                type="primary"
                icon={<FiPlus />}
                onClick={() => navigate('/admin/categories')}
                className="mt-4 bg-indigo-600 hover:bg-indigo-700"
              >
                Create First Category
              </Button>
            </div>
          )}
          
          {filteredCategories.length > 0 && (
            <div className="mt-4 flex justify-between items-center">
              <Text className="text-gray-500 text-xs sm:text-sm">
                Showing {Math.min(filteredCategories.length, isMobile ? 6 : isTablet ? 9 : 12)} of {categories.length} categories
              </Text>
              {filteredCategories.length < categories.length && (
                <Button
                  type="link"
                  onClick={() => navigate('/admin/categories')}
                  size={isMobile ? "small" : "middle"}
                >
                  Show All Categories
                </Button>
              )}
            </div>
          )}
        </Card>
      </motion.div>

      {/* Recent Users Table - Responsive */}
      <motion.div variants={itemVariants} className="mt-6 md:mt-10">
        <Card 
          title={
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <FiUser className="mr-2 text-blue-600" />
                <h2 className="text-lg md:text-xl font-semibold text-gray-800">Recent Users</h2>
              </div>
            </div>
          }
          bordered={false}
          className="shadow-md bg-white"
          loading={refreshing}
        >
          <div className="overflow-x-auto">
            {adminData?.recentUsers?.length > 0 ? (
              <Table 
                dataSource={adminData.recentUsers}
                columns={userColumns}
                rowKey={record => record._id || Math.random().toString(36).substr(2, 9)}
                pagination={false}
                className="bg-white responsive-table"
                size={isMobile ? "small" : "middle"}
                scroll={{ x: isMobile ? 500 : 'max-content' }}
                onRow={(record) => ({
                  onClick: () => navigate(`/admin/users/${record._id}`),
                  className: 'cursor-pointer hover:bg-blue-50'
                })}
              />
            ) : renderEmptyState("No recent users found")}
          </div>
        </Card>
      </motion.div>

      {/* Recent Listings Table - Responsive */}
      <motion.div variants={itemVariants} className="mt-6 md:mt-10 mb-6">
        <Card 
          title={
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <FiHome className="mr-2 text-blue-600" />
                <h2 className="text-lg md:text-xl font-semibold text-gray-800">Recent Listings</h2>
              </div>
              <div className="flex items-center space-x-2">
                <Button 
                  type="primary"
                  icon={<FiPlus />}
                  onClick={() => navigate('/admin/listings')}
                  className="bg-green-600 hover:bg-green-700 hidden sm:flex"
                >
                  Add Listing
                </Button>
                <Button 
                  type="link" 
                  onClick={() => navigate('/admin/listings')} 
                  className="p-0 flex items-center"
                >
                  View All <span className="ml-1">→</span>
                </Button>
              </div>
            </div>
          }
          bordered={false}
          className="shadow-md bg-white"
          loading={refreshing || listingsLoading}
          extra={
            <div className={`flex flex-col ${isMobile ? 'space-y-2' : 'sm:flex-row sm:space-x-2'} mb-4 sm:mb-0`}>
              <Button
                icon={<FiRefreshCw />}
                onClick={fetchRecentListings}
                loading={listingsLoading}
                size="small"
              >
                Refresh
              </Button>
              <Select
                placeholder="Filter by status"
                style={{ width: isMobile ? '100%' : 140 }}
                onChange={(value) => {
                  // Filter logic would go here for UI filtering
                  
                  
                  // This would just filter the existing data client-side
                  if (value) {
                    const filtered = recentListings.filter(item => 
                      (item.status || 'active').toLowerCase() === value.toLowerCase()
                    );
                    setRecentListings(filtered);
                  } else {
                    // Reload listings if filter is cleared
                    fetchRecentListings();
                  }
                }}
                allowClear
                onClear={() => fetchRecentListings()}
                size={isMobile ? "small" : "middle"}
              >
                <Option value="active">Active</Option>
                <Option value="pending">Pending</Option>
                <Option value="inactive">Inactive</Option>
              </Select>
              <Input.Search
                placeholder="Search listings"
                style={{ width: isMobile ? '100%' : 200 }}
                onSearch={(value) => {
                  if (value) {
                    // Simple client-side search
                    const filtered = recentListings.filter(item => 
                      item.name?.toLowerCase().includes(value.toLowerCase()) || 
                      item.location?.toLowerCase().includes(value.toLowerCase())
                    );
                    setRecentListings(filtered);
                  } else {
                    fetchRecentListings();
                  }
                }}
                allowClear
                onClear={() => fetchRecentListings()}
                size={isMobile ? "small" : "middle"}
              />
            </div>
          }
        >
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            {recentListings.length > 0 ? (
              <>
                <Table 
                  dataSource={recentListings}
                  columns={listingColumns}
                  rowKey={record => record._id || Math.random().toString(36).substr(2, 9)}
                  pagination={false}
                  className="bg-white responsive-table"
                  size={isMobile ? "small" : "middle"}
                  scroll={{ x: isMobile ? 500 : 'max-content' }}
                  onRow={(record) => ({
                    onClick: () => navigate(`/admin/listings`),
                    className: 'cursor-pointer hover:bg-blue-50'
                  })}
                />
                {/* Status summary */}
                <div className={`mt-4 flex flex-wrap gap-2 ${isMobile ? 'justify-center' : 'justify-end'}`}>
                  <Tag color="green" className="px-3 py-1">
                    <span className="font-medium">
                      {recentListings.filter(item => (item.status || 'active') === 'active').length}
                    </span> Active
                  </Tag>
                  <Tag color="orange" className="px-3 py-1">
                    <span className="font-medium">
                      {recentListings.filter(item => item.status === 'pending').length}
                    </span> Pending
                  </Tag>
                  <Tag color="red" className="px-3 py-1">
                    <span className="font-medium">
                      {recentListings.filter(item => 
                        item.status && item.status !== 'active' && item.status !== 'pending'
                      ).length}
                    </span> Inactive
                  </Tag>
                </div>
              </>
            ) : (
              <div className="py-8 text-center">
                <Empty 
                  description={
                    <div>
                      <p className="text-lg text-gray-500 mb-3">No listings found</p>
                      <p className="text-sm text-gray-400 mb-4">
                        {listingsLoading ? 'Loading listings...' : 'Start adding listings to your directory'}
                      </p>
                    </div>
                  }
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
                <Button
                  type="primary"
                  icon={<FiPlus />}
                  onClick={() => navigate('/admin/listings')}
                  className="mt-4 bg-green-600 hover:bg-green-700"
                >
                  Create First Listing
                </Button>
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;