import dashboard from './dashboard';

// Export as function instead of object
const getMenuItems = (user) => {
  const role = user?.role || 'qa';
  
  return {
    items: [dashboard(role)]
  };
};

export default getMenuItems;