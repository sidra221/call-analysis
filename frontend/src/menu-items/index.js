import dashboard from './dashboard';

const user = JSON.parse(localStorage.getItem('authUser'));
const role = user?.role || 'qa';

const menuItems = {
  items: [dashboard(role)]
};

export default menuItems;