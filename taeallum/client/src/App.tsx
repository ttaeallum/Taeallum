import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HelmetProvider } from 'react-helmet-async';
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Tracks from "@/pages/tracks";
import Courses from "@/pages/courses";
import CourseDetails from "@/pages/course-details";
import LearnCourse from "@/pages/learn-course";
import Auth from "@/pages/auth";
import Dashboard from "@/pages/dashboard";
import Account from "@/pages/account";
import Checkout from "@/pages/checkout";
import AdminDashboard from "@/pages/admin-dashboard";
import AdminCourses from "@/pages/admin-courses";
import AdminCurriculum from "@/pages/admin-curriculum";
import AdminCategories from "@/pages/admin-categories";
import AdminUsers from "@/pages/admin-users";
import AdminEnrollments from "@/pages/admin-enrollments";
import AdminOrders from "@/pages/admin-orders";
import AdminAudit from "@/pages/admin-audit";
import AdminAddCourse from "@/pages/admin-add-course";
import AdminAds from "@/pages/admin-ads";
import Blog from "@/pages/blog";
import AdminLogin from "@/pages/admin-login";
import AIAgent from "@/pages/ai-agent";
import AIPricing from "@/pages/ai-pricing";
import FAQ from "@/pages/faq";
import Contact from "@/pages/contact";
import Terms from "@/pages/terms";
import Privacy from "@/pages/privacy";
import Support from "@/pages/support";

import { AIChatbot } from "@/components/AIChatbot";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/pricing">
        <Redirect to="/ai-pricing" />
      </Route>
      <Route path="/tracks" component={Tracks} />
      <Route path="/courses" component={Courses} />
      <Route path="/courses/:slug" component={CourseDetails} />
      <Route path="/checkout/:courseId" component={Checkout} />

      {/* Auth aliases */}
      <Route path="/auth" component={Auth} />
      <Route path="/login">
        <Redirect to="/auth" />
      </Route>
      <Route path="/register">
        <Redirect to="/auth" />
      </Route>

      <Route path="/dashboard" component={Dashboard} />
      <Route path="/account" component={Account} />
      <Route path="/learn/:courseId" component={LearnCourse} />

      {/* Admin routes */}
      <Route path="/admin">
        <Redirect to="/admin/dashboard" />
      </Route>
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/courses" component={AdminCourses} />
      <Route path="/admin/courses/add" component={AdminAddCourse} />
      <Route path="/admin/courses/:courseId/curriculum" component={AdminCurriculum} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/enrollments" component={AdminEnrollments} />
      <Route path="/admin/orders" component={AdminOrders} />
      <Route path="/admin/audit" component={AdminAudit} />
      <Route path="/admin/ads" component={AdminAds} />
      <Route path="/admin/login" component={AdminLogin} />

      <Route path="/blog" component={Blog} />
      <Route path="/ai-agent" component={AIAgent} />
      <Route path="/ai-pricing" component={AIPricing} />
      <Route path="/faq" component={FAQ} />
      <Route path="/contact" component={Contact} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/support" component={Support} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <HelmetProvider>
          <Toaster />
          {/* <AIChatbot /> */}
          <Router />
        </HelmetProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
