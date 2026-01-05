import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Banknote,
  Lock,
  LogOut,
  Bell,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  FileText,
  Link2,
  Copy,
  ExternalLink,
  CreditCard,
} from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
  under_review: { label: "Under Review", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Eye },
  documents_required: { label: "Docs Required", color: "bg-orange-100 text-orange-800 border-orange-200", icon: FileText },
  approved: { label: "Approved", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [applications, setApplications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedApp, setSelectedApp] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [documentRequestMessage, setDocumentRequestMessage] = useState("");
  const [showDocumentRequest, setShowDocumentRequest] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    const stored = sessionStorage.getItem("adminAuth");
    if (stored === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  const fetchData = async () => {
    try {
      const [appsRes, notifRes, statsRes, unreadRes] = await Promise.all([
        axios.get(`${API}/applications`),
        axios.get(`${API}/notifications?recipient_type=admin`),
        axios.get(`${API}/stats`),
        axios.get(`${API}/notifications/unread-count?recipient_type=admin`),
      ]);
      setApplications(appsRes.data);
      setNotifications(notifRes.data);
      setStats(statsRes.data);
      setUnreadCount(unreadRes.data.count);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch data");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await axios.post(`${API}/admin/login`, { password });
      setIsAuthenticated(true);
      sessionStorage.setItem("adminAuth", "true");
      toast.success("Login successful");
    } catch (error) {
      toast.error("Invalid password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem("adminAuth");
    setPassword("");
  };

  const handleStatusChange = async (applicationId, newStatus, message = null) => {
    try {
      const payload = { status: newStatus };
      if (message) {
        payload.document_request_message = message;
      }
      await axios.patch(`${API}/applications/${applicationId}/status`, payload);
      toast.success(`Status updated to ${STATUS_CONFIG[newStatus].label}`);
      fetchData();
      setSelectedApp(null);
      setShowDocumentRequest(false);
      setDocumentRequestMessage("");
    } catch (error) {
      toast.error("Failed to update status");
    }
  };

  const markNotificationRead = async (notificationId) => {
    try {
      await axios.patch(`${API}/notifications/${notificationId}/read`);
      fetchData();
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const copyApprovalLink = (token) => {
    const link = `${window.location.origin}/accept-loan/${token}`;
    navigator.clipboard.writeText(link);
    toast.success("Approval link copied to clipboard!");
  };

  const filteredApplications = applications
    .filter((app) => {
      const matchesSearch =
        app.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        app.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || app.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-2xl border border-emerald-900/5 p-8 shadow-sm">
            <div className="flex items-center justify-center gap-2 mb-8">
              <Banknote className="w-8 h-8 text-emerald-900" />
              <span className="text-xl font-bold text-emerald-900 font-['Manrope']">
                LoanEase Admin
              </span>
            </div>

            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-emerald-900" />
            </div>

            <h1 className="text-2xl font-semibold text-center text-slate-900 font-['Manrope'] mb-2">
              Admin Access
            </h1>
            <p className="text-center text-slate-500 mb-8">
              Enter admin password to continue
            </p>

            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <Input
                  type="password"
                  data-testid="admin-password-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="h-14 bg-white border-emerald-900/10 focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900 rounded-lg text-base text-center"
                />
              </div>
              <Button
                type="submit"
                data-testid="admin-login-btn"
                disabled={isLoading || !password}
                className="w-full h-14 bg-emerald-900 hover:bg-emerald-800 text-white rounded-full text-lg font-medium transition-all"
              >
                {isLoading ? "Verifying..." : "Access Dashboard"}
              </Button>
            </form>

            <button
              onClick={() => navigate("/")}
              className="mt-6 text-sm text-slate-500 hover:text-emerald-900 transition-colors w-full text-center"
            >
              ← Back to Home
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      {/* Header */}
      <header className="bg-white border-b border-emerald-900/5 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Banknote className="w-6 h-6 text-emerald-900" />
            <span className="text-lg font-bold text-emerald-900 font-['Manrope']">
              LoanEase Admin
            </span>
          </div>

          <div className="flex items-center gap-4">
            {/* Notifications */}
            <div className="relative">
              <button
                data-testid="notifications-btn"
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-full hover:bg-emerald-50 transition-colors"
              >
                <Bell className="w-5 h-5 text-slate-600" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 top-12 w-96 bg-white rounded-xl border border-emerald-900/10 shadow-lg overflow-hidden z-50"
                  >
                    <div className="p-4 border-b border-emerald-900/5">
                      <h3 className="font-semibold text-slate-900">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-slate-500">
                          No notifications
                        </div>
                      ) : (
                        notifications.slice(0, 10).map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => markNotificationRead(notif.id)}
                            className={`p-4 border-b border-emerald-900/5 cursor-pointer hover:bg-emerald-50 transition-colors ${
                              !notif.read ? "bg-emerald-50/50" : ""
                            }`}
                          >
                            <p className="font-medium text-sm text-slate-900 mb-1">
                              {notif.subject}
                            </p>
                            <p className="text-xs text-slate-500 line-clamp-2">
                              {notif.message}
                            </p>
                            <p className="text-xs text-slate-400 mt-2">
                              {format(new Date(notif.created_at), "MMM d, h:mm a")}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button
              variant="outline"
              onClick={fetchData}
              className="gap-2 border-emerald-900/10"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>

            <Button
              variant="ghost"
              data-testid="logout-btn"
              onClick={handleLogout}
              className="gap-2 text-slate-600 hover:text-red-600"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl border border-emerald-900/5 p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-emerald-900" />
                </div>
                <span className="text-sm text-slate-500">Total Applications</span>
              </div>
              <p data-testid="total-applications" className="text-3xl font-bold text-slate-900">
                {stats.total_applications}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl border border-emerald-900/5 p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-yellow-50 rounded-lg flex items-center justify-center">
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
                <span className="text-sm text-slate-500">Pending Review</span>
              </div>
              <p data-testid="pending-count" className="text-3xl font-bold text-slate-900">
                {stats.pending + stats.under_review}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl border border-emerald-900/5 p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm text-slate-500">Approved</span>
              </div>
              <p data-testid="approved-count" className="text-3xl font-bold text-slate-900">
                {stats.approved}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl border border-emerald-900/5 p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-lime-50 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-lime-600" />
                </div>
                <span className="text-sm text-slate-500">Total Requested</span>
              </div>
              <p data-testid="total-amount" className="text-3xl font-bold text-slate-900">
                ${(stats.total_requested_amount / 1000).toFixed(0)}K
              </p>
            </motion.div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-emerald-900/5 p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                data-testid="search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, email, or ID..."
                className="pl-10 h-12 bg-white border-emerald-900/10 rounded-lg"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger data-testid="status-filter" className="w-full md:w-48 h-12">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="documents_required">Docs Required</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Applications Table */}
        <div className="bg-white rounded-xl border border-emerald-900/5 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold">Applicant</TableHead>
                <TableHead className="font-semibold">Contact</TableHead>
                <TableHead className="font-semibold">Amount</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Loan Link</TableHead>
                <TableHead className="font-semibold">Date</TableHead>
                <TableHead className="font-semibold text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedApplications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                    No applications found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedApplications.map((app) => {
                  const StatusIcon = STATUS_CONFIG[app.status]?.icon || Clock;
                  return (
                    <TableRow
                      key={app.id}
                      data-testid={`application-row-${app.id}`}
                      className="hover:bg-emerald-50/50 transition-colors"
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-slate-900">
                            {app.first_name} {app.last_name}
                          </p>
                          <p className="text-xs text-slate-500 font-mono">
                            {app.id.slice(0, 8).toUpperCase()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-slate-900">{app.email}</p>
                          <p className="text-xs text-slate-500">{app.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-slate-900">
                          ${app.loan_amount_requested.toLocaleString()}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${STATUS_CONFIG[app.status]?.color} border gap-1`}
                        >
                          <StatusIcon className="w-3 h-3" />
                          {STATUS_CONFIG[app.status]?.label}
                        </Badge>
                        {app.banking_info_submitted && (
                          <Badge className="ml-2 bg-lime-100 text-lime-800 border-lime-200 border gap-1">
                            <CreditCard className="w-3 h-3" />
                            Banking
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {app.status === "approved" && app.approval_token ? (
                          <div className="flex items-center gap-1">
                            {app.banking_info_submitted ? (
                              <span className="text-xs text-green-600 font-medium">Completed</span>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  data-testid={`copy-link-${app.id}`}
                                  onClick={() => copyApprovalLink(app.approval_token)}
                                  className="h-8 px-2 text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50"
                                >
                                  <Copy className="w-3 h-3 mr-1" />
                                  Copy
                                </Button>
                                <a
                                  href={`/accept-loan/${app.approval_token}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-emerald-700 hover:text-emerald-900 p-1"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <p className="text-sm text-slate-500">
                          {format(new Date(app.created_at), "MMM d, yyyy")}
                        </p>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          data-testid={`view-details-${app.id}`}
                          onClick={() => setSelectedApp(app)}
                          className="border-emerald-900/10 hover:bg-emerald-50"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-emerald-900/5">
              <p className="text-sm text-slate-500">
                Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
                {Math.min(currentPage * itemsPerPage, filteredApplications.length)} of{" "}
                {filteredApplications.length} applications
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Application Detail Modal */}
      <AnimatePresence>
        {selectedApp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50"
            onClick={() => setSelectedApp(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="p-6 border-b border-emerald-900/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900 font-['Manrope']">
                      Application Details
                    </h2>
                    <p className="text-sm text-slate-500 font-mono">
                      {selectedApp.id.slice(0, 8).toUpperCase()}
                    </p>
                  </div>
                  <Badge className={`${STATUS_CONFIG[selectedApp.status]?.color} border`}>
                    {STATUS_CONFIG[selectedApp.status]?.label}
                  </Badge>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Personal Info */}
                <div>
                  <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400">Full Name</p>
                      <p className="font-medium text-slate-900">
                        {selectedApp.first_name} {selectedApp.last_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Email</p>
                      <p className="font-medium text-slate-900">{selectedApp.email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Phone</p>
                      <p className="font-medium text-slate-900">{selectedApp.phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Date of Birth</p>
                      <p className="font-medium text-slate-900">{selectedApp.date_of_birth}</p>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div>
                  <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
                    Address
                  </h3>
                  <p className="font-medium text-slate-900">
                    {selectedApp.street_address}
                    <br />
                    {selectedApp.city}, {selectedApp.state} {selectedApp.zip_code}
                  </p>
                </div>

                {/* Financial Info */}
                <div>
                  <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
                    Financial Information
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-slate-400">Loan Amount Requested</p>
                      <p className="text-2xl font-bold text-emerald-900">
                        ${selectedApp.loan_amount_requested.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Annual Income</p>
                      <p className="font-medium text-slate-900">
                        ${selectedApp.annual_income.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Employment Status</p>
                      <p className="font-medium text-slate-900 capitalize">
                        {selectedApp.employment_status.replace("_", " ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">SSN (Last 4)</p>
                      <p className="font-medium text-slate-900">••••{selectedApp.ssn_last_four}</p>
                    </div>
                  </div>
                </div>

                {/* Documents Section */}
                {selectedApp.documents && selectedApp.documents.length > 0 && (
                  <div>
                    <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider mb-3">
                      Uploaded Documents ({selectedApp.documents.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedApp.documents.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between bg-slate-50 rounded-lg p-3"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-5 h-5 text-slate-400" />
                            <div>
                              <p className="text-sm font-medium text-slate-900">{doc.filename}</p>
                              <p className="text-xs text-slate-500">
                                {(doc.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <a
                            href={`${API}/applications/${selectedApp.id}/documents/${doc.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-700 hover:text-emerald-900 text-sm font-medium"
                          >
                            View
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Approval Link Section */}
                {selectedApp.status === "approved" && selectedApp.approval_token && (
                  <div className="bg-emerald-50 rounded-xl p-4">
                    <h3 className="text-sm font-medium text-emerald-800 mb-2 flex items-center gap-2">
                      <Link2 className="w-4 h-4" />
                      Approval Link for Borrower
                    </h3>
                    {selectedApp.banking_info_submitted ? (
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">Banking information submitted - Loan accepted</span>
                      </div>
                    ) : (
                      <>
                        <p className="text-xs text-emerald-600 mb-3">
                          Share this link with the borrower to complete their loan acceptance:
                        </p>
                        <div className="flex gap-2">
                          <Input
                            readOnly
                            value={`${window.location.origin}/accept-loan/${selectedApp.approval_token}`}
                            className="text-xs bg-white"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            data-testid="copy-approval-link-btn"
                            onClick={() => copyApprovalLink(selectedApp.approval_token)}
                            className="shrink-0"
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            Copy
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* Status Update */}
                <div className="bg-slate-50 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-slate-700 mb-3">Update Status</h3>
                  
                  {/* Document Request Section */}
                  {showDocumentRequest ? (
                    <div className="space-y-3 mb-4">
                      <textarea
                        data-testid="document-request-message"
                        value={documentRequestMessage}
                        onChange={(e) => setDocumentRequestMessage(e.target.value)}
                        placeholder="Describe what documents are needed (e.g., 'Please upload proof of income and ID')"
                        className="w-full h-24 p-3 border border-emerald-900/10 rounded-lg text-sm resize-none focus:outline-none focus:ring-1 focus:ring-emerald-900"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          data-testid="confirm-document-request-btn"
                          onClick={() => handleStatusChange(selectedApp.id, "documents_required", documentRequestMessage)}
                          className="bg-orange-600 hover:bg-orange-700"
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Send Request
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setShowDocumentRequest(false);
                            setDocumentRequestMessage("");
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(STATUS_CONFIG).map(([status, config]) => {
                        const Icon = config.icon;
                        if (status === "documents_required") {
                          return (
                            <Button
                              key={status}
                              variant="outline"
                              size="sm"
                              data-testid="request-documents-btn"
                              onClick={() => setShowDocumentRequest(true)}
                              disabled={selectedApp.status === status}
                              className="border-orange-200 text-orange-700 hover:bg-orange-50"
                            >
                              <Icon className="w-4 h-4 mr-1" />
                              Request Docs
                            </Button>
                          );
                        }
                        return (
                          <Button
                            key={status}
                            variant={selectedApp.status === status ? "default" : "outline"}
                            size="sm"
                            data-testid={`status-btn-${status}`}
                            onClick={() => handleStatusChange(selectedApp.id, status)}
                            disabled={selectedApp.status === status}
                            className={
                              selectedApp.status === status
                                ? "bg-emerald-900"
                                : "border-emerald-900/10"
                            }
                          >
                            <Icon className="w-4 h-4 mr-1" />
                            {config.label}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-emerald-900/5">
                <Button
                  variant="outline"
                  onClick={() => setSelectedApp(null)}
                  className="w-full border-emerald-900/10"
                >
                  Close
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminDashboard;
