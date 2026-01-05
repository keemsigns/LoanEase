import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CheckCircle2, Home, Banknote, Clock, Mail, Phone } from "lucide-react";

const SuccessPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const applicationId = location.state?.applicationId;

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      {/* Header */}
      <header className="px-6 md:px-12 lg:px-24 py-6 border-b border-emerald-900/5">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Banknote className="w-6 h-6 text-emerald-900" />
            <span className="text-lg font-bold text-emerald-900 font-['Manrope']">LoanEase</span>
          </div>
        </div>
      </header>

      {/* Success Content */}
      <div className="px-6 md:px-12 lg:px-24 py-16 md:py-24">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.6 }}
            className="w-24 h-24 bg-lime-400 rounded-full flex items-center justify-center mx-auto mb-8"
          >
            <CheckCircle2 className="w-12 h-12 text-emerald-900" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <h1 
              data-testid="success-title"
              className="text-4xl md:text-5xl font-bold text-slate-900 font-['Manrope'] mb-4"
            >
              Application Submitted!
            </h1>
            <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
              Thank you for applying. We've received your loan application and will review it shortly.
            </p>

            {applicationId && (
              <div className="bg-white rounded-2xl border border-emerald-900/5 p-6 mb-8 inline-block">
                <p className="text-sm text-slate-500 mb-1">Application Reference</p>
                <p 
                  data-testid="application-id"
                  className="font-mono text-lg font-semibold text-emerald-900"
                >
                  {applicationId.slice(0, 8).toUpperCase()}
                </p>
              </div>
            )}
          </motion.div>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-white rounded-2xl border border-emerald-900/5 p-8 text-left mb-10"
          >
            <h2 className="text-xl font-semibold text-slate-900 font-['Manrope'] mb-6">
              What happens next?
            </h2>
            
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-emerald-900" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">Review Process</h3>
                  <p className="text-sm text-slate-500">Our team will review your application within 24 hours.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-emerald-900" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">Email Confirmation</h3>
                  <p className="text-sm text-slate-500">You'll receive an email with the decision and next steps.</p>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-emerald-900" />
                </div>
                <div>
                  <h3 className="font-medium text-slate-900">Need Help?</h3>
                  <p className="text-sm text-slate-500">Contact us at (555) 123-4567 for any questions.</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Back to Home Button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <Button
              data-testid="back-home-btn"
              onClick={() => navigate("/")}
              className="bg-emerald-900 hover:bg-emerald-800 text-white rounded-full px-10 py-6 text-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Home className="w-5 h-5 mr-2" />
              Back to Home
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Background Image */}
      <div className="fixed bottom-0 right-0 opacity-10 pointer-events-none">
        <img
          src="https://images.unsplash.com/photo-1595944356863-e624f8234e1e?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NTY2Njd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBob21lJTIwa2V5c3xlbnwwfHx8fDE3Njc2NDQwMjJ8MA&ixlib=rb-4.1.0&q=85"
          alt=""
          className="w-96 h-96 object-cover"
        />
      </div>
    </div>
  );
};

export default SuccessPage;
