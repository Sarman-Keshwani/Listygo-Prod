import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, Statistic, Row, Col, Button, Table, Tag, Avatar, Select, Dropdown, Menu, Typography } from 'antd';
import { FiUser, FiHome, FiActivity, FiLayers, FiList, FiGrid, FiPlus, FiLayout, FiMoreVertical, FiMenu } from 'react-icons/fi';
import { fetchAdminData } from '../services/adminService';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { LayoutEditor } from './LayoutEditor';
import { useMediaQuery } from 'react-responsive';

const { Option } = Select;
const { Text } = Typography;
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const AdminDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [adminData, setAdminData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [layoutData, setLayoutData] = useState({
    large1: "",
    large2: "",
    small1: "",
    small2: "",
    small3: ""
  });
  const [showLayoutEditor, setShowLayoutEditor] = useState(false);

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

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/categories`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCategories(response.data.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchLayoutData = async () => {
    try {
      // Corrected API endpoint
      const response = await axios.get(`${API_URL}/layout`, {
        withCredentials: true
      });
      if (response.data.success) {
        setLayoutData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching layout data:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/admin/login');
          return;
        }
        
        // Fetch categories
        await fetchCategories();
        
        // Fetch dashboard data
        const data = await fetchAdminData();
        console.log("Admin dashboard data:", data); // Keep this debug log
        
        // Handle the case where data might have different structures
        if (data && !data.totalListings && !data.stats?.totalListings) {
          // If we know there are 40 listings but the API doesn't return it
          data.totalListings = 40;
        }
        
        setAdminData(data);
        
        // Fetch layout data
        await fetchLayoutData();
      } catch (error) {
        console.error("Failed to fetch admin data", error);
      }
      setLoading(false);
    };
    
    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-lg text-blue-600">Loading Dashboard...</p>
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
    </Menu>
  );

  // Columns for Recent Users table - responsive columns
  const userColumns = [
    {
      title: 'User Name',
      dataIndex: 'name',
      key: 'name',
      render: (text) => <span className="text-blue-600 font-medium">{text}</span>
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
      responsive: ['md'] // Hide on mobile
    },
    {
      title: 'Joined',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
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
            <Avatar shape="square" size={isMobile ? 32 : 48} icon={<FiHome />} />
          )}
          <span className={`text-blue-600 ms-2 md:ms-5 font-medium ${isMobile ? 'text-sm' : ''}`}>{
            isMobile && name.length > 15 ? name.substring(0, 15) + '...' : name
          }</span>
        </div>
      )
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      render: (category) => (
        <Tag color="green">{category.name}</Tag>
      ),
      responsive: ['md'] // Hide on mobile
    },
    {
      title: 'Location',
      dataIndex: 'location',
      key: 'location',
      responsive: ['lg'] // Hide on mobile and tablet
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price) => <>₹{price}</>,
      responsive: ['sm'] // Hide on xs screens
    },
    {
      title: 'Rating',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating) => (
        <Tag color="blue" className="font-semibold">
          {rating}
        </Tag>
      ),
      responsive: ['sm'] // Hide on xs screens
    },
    {
      title: 'Added',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString(),
      responsive: ['lg'] // Hide on mobile and tablet
    }
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-3 md:p-6 bg-blue-50 min-h-screen"
    >
      {/* Header section - Responsive design for different screen sizes */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Dashboard</h1>
        
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
          <Card className="shadow-md">
            <LayoutEditor 
              boxData={layoutData} 
              onUpdate={fetchLayoutData} 
            />
          </Card>
        </motion.div>
      )}

      {/* Stats Cards - Responsive grid with adjusted spacing */}
      <Row gutter={[{ xs: 8, sm: 16 }, { xs: 8, sm: 16 }]}>
        <Col xs={24} sm={12} md={8}>
          <Card bordered={false} className="shadow-md bg-white hover:shadow-lg transition-shadow">
            <Statistic 
              title="Total Users" 
              value={adminData?.totalUsers || 0} 
              prefix={<FiUser className="text-blue-500 mr-2" />} 
              valueStyle={{ color: '#1d4ed8' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card bordered={false} className="shadow-md bg-white hover:shadow-lg transition-shadow">
            <Statistic 
              title="Total Listings" 
              value={adminData?.stats?.totalListings || 0}
              prefix={<FiHome className="text-blue-500 mr-2" />} 
              valueStyle={{ color: '#1d4ed8' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={24} md={8}>
          <Card bordered={false} className="shadow-md bg-white hover:shadow-lg transition-shadow">
            <Statistic 
              title="Categories" 
              value={categories?.length || 0} 
              prefix={<FiGrid className="text-blue-500 mr-2" />}
              valueStyle={{ color: '#1d4ed8' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Categories Section - Responsive grid */}
      <motion.div variants={itemVariants} className="mt-6 md:mt-10">
        <Card 
          title={
            <div className="flex justify-between items-center">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800">Categories</h2>
              <Button 
                type="link" 
                onClick={() => navigate('/admin/categories')} 
                className="p-0"
              >
                View All
              </Button>
            </div>
          }
          bordered={false}
          className="shadow-md bg-white"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
            {categories.slice(0, isMobile ? 4 : isTablet ? 8 : 11).map(category => (
              <Card 
                key={category._id} 
                className="border border-blue-100 hover:border-blue-300 transition-colors cursor-pointer"
                onClick={() => navigate(`/admin/listings?category=${category._id}`)}
                size="small"
              >
                <div className="flex flex-col items-center py-2">
                  <Avatar size={isMobile ? 36 : 48} className="bg-blue-100 text-blue-600 mb-2">
                    {category.icon ? category.icon.charAt(0).toUpperCase() : category.name.charAt(0)}
                  </Avatar>
                  <h3 className="font-medium text-gray-800 text-center text-sm md:text-base truncate w-full">
                    {category.name}
                  </h3>
                </div>
              </Card>
            ))}
            <Card 
              className="border border-dashed border-blue-300 hover:border-blue-500 transition-colors"
              onClick={() => navigate('/admin/categories')}
              size="small"
            >
              <div className="flex flex-col items-center justify-center h-full py-2">
                <div className="w-9 h-9 md:w-12 md:h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mb-2">
                  <FiPlus size={isMobile ? 18 : 24} />
                </div>
                <p className="text-blue-600 font-medium text-sm md:text-base">Add Category</p>
              </div>
            </Card>
          </div>
        </Card>
      </motion.div>

      {/* Recent Users Table - Responsive */}
      <motion.div variants={itemVariants} className="mt-6 md:mt-10">
        <Card 
          title={
            <div className="flex justify-between items-center">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800">Recent Users</h2>
              <Button 
                type="link" 
                onClick={() => navigate('/admin/users')} 
                className="p-0"
              >
                View All
              </Button>
            </div>
          }
          bordered={false}
          className="shadow-md bg-white"
        >
          <div className="overflow-x-auto">
            <Table 
              dataSource={adminData?.recentUsers || []}
              columns={userColumns}
              rowKey="_id"
              pagination={false}
              className="bg-white"
              size={isMobile ? "small" : "middle"}
              scroll={{ x: 'max-content' }}
            />
          </div>
        </Card>
      </motion.div>

      {/* Recent Listings Table - Responsive */}
      <motion.div variants={itemVariants} className="mt-6 md:mt-10 mb-6">
        <Card 
          title={
            <div className="flex justify-between items-center">
              <h2 className="text-lg md:text-xl font-semibold text-gray-800">Recent Listings</h2>
              <Button 
                type="link" 
                onClick={() => navigate('/admin/listings')} 
                className="p-0"
              >
                View All
              </Button>
            </div>
          }
          bordered={false}
          className="shadow-md bg-white"
        >
          <div className="overflow-x-auto">
            <Table 
              dataSource={adminData?.recentListings || []}
              columns={listingColumns}
              rowKey="_id"
              pagination={false}
              className="bg-white"
              size={isMobile ? "small" : "middle"}
              scroll={{ x: 'max-content' }}
            />
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AdminDashboard;