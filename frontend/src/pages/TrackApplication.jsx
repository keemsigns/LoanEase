import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Banknote,
  Search,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Mail,
  ChevronLeft,
  FileText,
  Loader2,
} from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 border-yellow-200", icon: Clock },
  under_review: { label: "Under Review", color: "bg-blue-100 text-blue-800 border-blue-200", icon: Eye },
  approved: { label: "Approved", color: "bg-green-100 text-green-800 border-green-200", icon: CheckCircle2 },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800 border-red-200", icon: XCircle },
};

const TrackApplication = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      const response = await axios.get(`${API}/notifications/applicant/${encodeURIComponent(email)}`);
      setNotifications(response.data);
      if (response.data.length === 0) {
        toast.info("No applications found for this email");
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
      toast.error("Failed to fetch application status");
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      {/* Header */}
      <header className="px-6 md:px-12 lg:px-24 py-6 border-b border-emerald-900/5">
        <div className="flex items-center justify-between">
          <button
            data-testid="back-btn"
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-slate-600 hover:text-emerald-900 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Back</span>
          </button>
          <div className="flex items-center gap-2">
            <Banknote className="w-6 h-6 text-emerald-900" />
            <span className="text-lg font-bold text-emerald-900 font-['Manrope']">LoanEase</span>
          </div>
          <div className="w-20" />
        </div>
      </header>

      <main className="px-6 md:px-12 lg:px-24 py-12 md:py-16">
        <div className="max-w-2xl mx-auto">
          {/* Search Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-emerald-900" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 font-['Manrope'] mb-3">
              Track Your Application
            </h1>
            <p className="text-lg text-slate-600">
              Enter your email to view your application status and messages
            </p>
          </motion.div>

          {/* Search Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSearch}
            className="bg-white rounded-2xl border border-emerald-900/5 p-6 md:p-8 shadow-sm mb-8"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="email"
                  data-testid="track-email-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="pl-12 h-14 bg-white border-emerald-900/10 focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900 rounded-lg text-base"
                />
              </div>
              <Button
                type="submit"
                data-testid="track-search-btn"
                disabled={isLoading}
                className="h-14 px-8 bg-emerald-900 hover:bg-emerald-800 text-white rounded-full text-lg font-medium transition-all"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Search"
                )}
              </Button>
            </div>
          </motion.form>

          {/* Results */}
          <AnimatePresence mode="wait">
            {hasSearched && notifications !== null && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                {notifications.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-emerald-900/5 p-12 text-center">
                    <FileText className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                      No Applications Found
                    </h3>
                    <p className="text-slate-500 mb-6">
                      We couldn't find any applications associated with this email.
                    </p>
                    <Button
                      onClick={() => navigate("/apply")}
                      className="bg-emerald-900 hover:bg-emerald-800 text-white rounded-full px-8"
                    >
                      Start New Application
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-slate-900 font-['Manrope']">
                      Your Messages ({notifications.length})
                    </h3>
                    {notifications.map((notif, index) => {
                      // Determine status from notification content
                      let status = "pending";
                      if (notif.subject.toLowerCase().includes("approved")) status = "approved";
                      else if (notif.subject.toLowerCase().includes("rejected") || notif.subject.toLowerCase().includes("declined")) status = "rejected";
                      else if (notif.subject.toLowerCase().includes("under review")) status = "under_review";
                      else if (notif.subject.toLowerCase().includes("received")) status = "pending";

                      const StatusIcon = STATUS_CONFIG[status]?.icon || Clock;

                      return (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          data-testid={`notification-${notif.id}`}
                          className="bg-white rounded-xl border border-emerald-900/5 p-6 shadow-sm"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                status === "approved" ? "bg-green-50" :
                                status === "rejected" ? "bg-red-50" :
                                status === "under_review" ? "bg-blue-50" :
                                "bg-yellow-50"
                              }`}>
                                <StatusIcon className={`w-5 h-5 ${
                                  status === "approved" ? "text-green-600" :
                                  status === "rejected" ? "text-red-600" :
                                  status === "under_review" ? "text-blue-600" :
                                  "text-yellow-600"
                                }`} />
                              </div>
                              <div>
                                <h4 className="font-semibold text-slate-900">{notif.subject}</h4>
                                <p className="text-xs text-slate-500">
                                  {format(new Date(notif.created_at), "MMMM d, yyyy 'at' h:mm a")}
                                </p>
                              </div>
                            </div>
                            <Badge className={`${STATUS_CONFIG[status]?.color} border`}>
                              {STATUS_CONFIG[status]?.label}
                            </Badge>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-4">
                            <p className="text-slate-700 whitespace-pre-line text-sm leading-relaxed">
                              {notif.message}
                            </p>
                          </div>
                          <p className="mt-3 text-xs text-slate-400 font-mono">
                            Ref: {notif.application_id.slice(0, 8).toUpperCase()}
                          </p>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default TrackApplication;
