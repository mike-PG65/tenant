import TenantDashboard from './pages/Home'
import Navbar from './components/Navbar';
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import AddComplaint from './pages/AddComplaint';
import AuthForm from './pages/AuthForm'
import Profile from './pages/Profile';
import PaymentSection from './pages/Payment';
import MyComplaints from './pages/MyComplaints';
import ViewComplaint from './components/ViewComplaint';
import MyMessages from './pages/MyMessage';
import ResetPassword from './components/ResetPassword';
const AppContent = () => {
  const location = useLocation();

  // Define routes where you don't want the Navbar
  const hideNavbarRoutes = ["/auth/login", "/auth/register"];

  // Check if current path matches any of the hidden routes
  const shouldShowNavbar = !hideNavbarRoutes.includes(location.pathname);

  return (
    <>
      {shouldShowNavbar && <Navbar />}
      <div className={shouldShowNavbar ? "pt-20" : ""}>
        <Routes>
          <Route path="/" element={<TenantDashboard />} />
          <Route path='/tenant/complaints' element={<AddComplaint/>}/> 
          <Route path="/auth/login" element={<AuthForm />} />
          <Route path="/auth/register" element={<AuthForm />} />
          <Route path='/tenant/profile' element={<Profile/>}/>
          <Route path='/tenant/payment' element={<PaymentSection/>}/>
          <Route path="/tenant/my-complaints" element={<MyComplaints/>}/>
          <Route path='tenant/complaints/:id' element={<ViewComplaint/>}/>
          <Route path='/tenant/edit-complaint/:id' element={<AddComplaint isEdit={true}/>}/>
          <Route path="/tenant/messages" element={<MyMessages />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* <Route path='/tenant/messages' element={<ViewMessages/>}/> */}
        </Routes>
      </div>
    </>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
