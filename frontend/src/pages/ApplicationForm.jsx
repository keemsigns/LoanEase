import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ChevronLeft, Banknote, CalendarIcon, CheckCircle2, Loader2 } from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const US_STATES = [
  { value: "AL", label: "Alabama" }, { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" }, { value: "AR", label: "Arkansas" },
  { value: "CA", label: "California" }, { value: "CO", label: "Colorado" },
  { value: "CT", label: "Connecticut" }, { value: "DE", label: "Delaware" },
  { value: "FL", label: "Florida" }, { value: "GA", label: "Georgia" },
  { value: "HI", label: "Hawaii" }, { value: "ID", label: "Idaho" },
  { value: "IL", label: "Illinois" }, { value: "IN", label: "Indiana" },
  { value: "IA", label: "Iowa" }, { value: "KS", label: "Kansas" },
  { value: "KY", label: "Kentucky" }, { value: "LA", label: "Louisiana" },
  { value: "ME", label: "Maine" }, { value: "MD", label: "Maryland" },
  { value: "MA", label: "Massachusetts" }, { value: "MI", label: "Michigan" },
  { value: "MN", label: "Minnesota" }, { value: "MS", label: "Mississippi" },
  { value: "MO", label: "Missouri" }, { value: "MT", label: "Montana" },
  { value: "NE", label: "Nebraska" }, { value: "NV", label: "Nevada" },
  { value: "NH", label: "New Hampshire" }, { value: "NJ", label: "New Jersey" },
  { value: "NM", label: "New Mexico" }, { value: "NY", label: "New York" },
  { value: "NC", label: "North Carolina" }, { value: "ND", label: "North Dakota" },
  { value: "OH", label: "Ohio" }, { value: "OK", label: "Oklahoma" },
  { value: "OR", label: "Oregon" }, { value: "PA", label: "Pennsylvania" },
  { value: "RI", label: "Rhode Island" }, { value: "SC", label: "South Carolina" },
  { value: "SD", label: "South Dakota" }, { value: "TN", label: "Tennessee" },
  { value: "TX", label: "Texas" }, { value: "UT", label: "Utah" },
  { value: "VT", label: "Vermont" }, { value: "VA", label: "Virginia" },
  { value: "WA", label: "Washington" }, { value: "WV", label: "West Virginia" },
  { value: "WI", label: "Wisconsin" }, { value: "WY", label: "Wyoming" }
];

const EMPLOYMENT_OPTIONS = [
  { value: "employed", label: "Employed Full-Time" },
  { value: "part_time", label: "Employed Part-Time" },
  { value: "self_employed", label: "Self-Employed" },
  { value: "retired", label: "Retired" },
  { value: "unemployed", label: "Unemployed" },
  { value: "student", label: "Student" }
];

const ApplicationForm = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    date_of_birth: null,
    // Step 2: Address Info
    street_address: "",
    city: "",
    state: "",
    zip_code: "",
    // Step 3: Financial Info
    annual_income: "",
    employment_status: "",
    loan_amount_requested: "",
    ssn_last_four: ""
  });

  const [errors, setErrors] = useState({});

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.first_name.trim()) newErrors.first_name = "First name is required";
      if (!formData.last_name.trim()) newErrors.last_name = "Last name is required";
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = "Invalid email format";
      }
      if (!formData.phone.trim()) {
        newErrors.phone = "Phone is required";
      } else if (!/^\d{10,15}$/.test(formData.phone.replace(/\D/g, ''))) {
        newErrors.phone = "Enter a valid phone number";
      }
      if (!formData.date_of_birth) newErrors.date_of_birth = "Date of birth is required";
    }
    
    if (step === 2) {
      if (!formData.street_address.trim()) newErrors.street_address = "Street address is required";
      if (!formData.city.trim()) newErrors.city = "City is required";
      if (!formData.state) newErrors.state = "State is required";
      if (!formData.zip_code.trim()) {
        newErrors.zip_code = "ZIP code is required";
      } else if (!/^\d{5}(-\d{4})?$/.test(formData.zip_code)) {
        newErrors.zip_code = "Enter a valid ZIP code";
      }
    }
    
    if (step === 3) {
      if (!formData.annual_income) {
        newErrors.annual_income = "Annual income is required";
      } else if (parseFloat(formData.annual_income) <= 0) {
        newErrors.annual_income = "Income must be greater than 0";
      }
      if (!formData.employment_status) newErrors.employment_status = "Employment status is required";
      if (!formData.loan_amount_requested) {
        newErrors.loan_amount_requested = "Loan amount is required";
      } else if (parseFloat(formData.loan_amount_requested) <= 0) {
        newErrors.loan_amount_requested = "Loan amount must be greater than 0";
      }
      if (!formData.ssn_last_four.trim()) {
        newErrors.ssn_last_four = "SSN last 4 digits required";
      } else if (!/^\d{4}$/.test(formData.ssn_last_four)) {
        newErrors.ssn_last_four = "Enter exactly 4 digits";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) return;
    
    setIsSubmitting(true);
    
    try {
      const payload = {
        ...formData,
        date_of_birth: formData.date_of_birth ? format(formData.date_of_birth, "yyyy-MM-dd") : "",
        annual_income: parseFloat(formData.annual_income),
        loan_amount_requested: parseFloat(formData.loan_amount_requested),
        phone: formData.phone.replace(/\D/g, '')
      };
      
      const response = await axios.post(`${API}/applications`, payload);
      
      if (response.data && response.data.id) {
        navigate("/success", { state: { applicationId: response.data.id } });
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(error.response?.data?.detail || "Failed to submit application. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: "Personal Info" },
    { number: 2, title: "Address" },
    { number: 3, title: "Financial Info" }
  ];

  const slideVariants = {
    enter: (direction) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0
    })
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      {/* Header */}
      <header className="px-6 md:px-12 lg:px-24 py-6 border-b border-emerald-900/5">
        <div className="flex items-center justify-between">
          <button
            data-testid="back-to-home-btn"
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
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </header>

      {/* Progress Bar */}
      <div className="px-6 md:px-12 lg:px-24 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <div
                    data-testid={`progress-step-${step.number}`}
                    className={`progress-step ${
                      currentStep > step.number
                        ? "completed"
                        : currentStep === step.number
                        ? "active"
                        : "inactive"
                    }`}
                  >
                    {currentStep > step.number ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      step.number
                    )}
                  </div>
                  <span className={`mt-2 text-xs font-medium ${
                    currentStep >= step.number ? "text-emerald-900" : "text-slate-400"
                  }`}>
                    {step.title}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`progress-line mx-4 ${
                      currentStep > step.number ? "active" : "inactive"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form Container */}
      <div className="px-6 md:px-12 lg:px-24 py-8">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="wait" custom={currentStep}>
            <motion.div
              key={currentStep}
              custom={currentStep}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ type: "tween", duration: 0.3 }}
              className="bg-white rounded-2xl border border-emerald-900/5 p-8 md:p-10 shadow-sm"
            >
              {/* Step 1: Personal Info */}
              {currentStep === 1 && (
                <div className="space-y-6" data-testid="step-1-form">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 font-['Manrope']">
                      Personal Information
                    </h2>
                    <p className="mt-2 text-slate-500">Let's start with the basics</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="first_name" className="text-sm font-medium text-slate-600">
                        First Name
                      </Label>
                      <Input
                        id="first_name"
                        data-testid="first-name-input"
                        value={formData.first_name}
                        onChange={(e) => updateFormData("first_name", e.target.value)}
                        placeholder="John"
                        className={`h-14 bg-white border-emerald-900/10 focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900 rounded-lg text-base ${
                          errors.first_name ? "border-red-500" : ""
                        }`}
                      />
                      {errors.first_name && (
                        <p className="text-sm text-red-500">{errors.first_name}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="last_name" className="text-sm font-medium text-slate-600">
                        Last Name
                      </Label>
                      <Input
                        id="last_name"
                        data-testid="last-name-input"
                        value={formData.last_name}
                        onChange={(e) => updateFormData("last_name", e.target.value)}
                        placeholder="Doe"
                        className={`h-14 bg-white border-emerald-900/10 focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900 rounded-lg text-base ${
                          errors.last_name ? "border-red-500" : ""
                        }`}
                      />
                      {errors.last_name && (
                        <p className="text-sm text-red-500">{errors.last_name}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-slate-600">
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      data-testid="email-input"
                      value={formData.email}
                      onChange={(e) => updateFormData("email", e.target.value)}
                      placeholder="john.doe@example.com"
                      className={`h-14 bg-white border-emerald-900/10 focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900 rounded-lg text-base ${
                        errors.email ? "border-red-500" : ""
                      }`}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-sm font-medium text-slate-600">
                      Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      data-testid="phone-input"
                      value={formData.phone}
                      onChange={(e) => updateFormData("phone", e.target.value)}
                      placeholder="(555) 123-4567"
                      className={`h-14 bg-white border-emerald-900/10 focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900 rounded-lg text-base ${
                        errors.phone ? "border-red-500" : ""
                      }`}
                    />
                    {errors.phone && (
                      <p className="text-sm text-red-500">{errors.phone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-600">Date of Birth</Label>
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          data-testid="dob-trigger"
                          className={`w-full h-14 justify-start text-left font-normal bg-white border-emerald-900/10 hover:bg-emerald-50 rounded-lg text-base ${
                            !formData.date_of_birth && "text-slate-400"
                          } ${errors.date_of_birth ? "border-red-500" : ""}`}
                        >
                          <CalendarIcon className="mr-3 h-5 w-5 text-slate-400" />
                          {formData.date_of_birth ? (
                            format(formData.date_of_birth, "MMMM d, yyyy")
                          ) : (
                            "Select your date of birth"
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 calendar-custom" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.date_of_birth}
                          onSelect={(date) => {
                            updateFormData("date_of_birth", date);
                            setDatePickerOpen(false);
                          }}
                          disabled={(date) =>
                            date > new Date() || date < new Date("1900-01-01")
                          }
                          initialFocus
                          captionLayout="dropdown-buttons"
                          fromYear={1940}
                          toYear={new Date().getFullYear() - 18}
                        />
                      </PopoverContent>
                    </Popover>
                    {errors.date_of_birth && (
                      <p className="text-sm text-red-500">{errors.date_of_birth}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 2: Address Info */}
              {currentStep === 2 && (
                <div className="space-y-6" data-testid="step-2-form">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 font-['Manrope']">
                      Address Information
                    </h2>
                    <p className="mt-2 text-slate-500">Where can we reach you?</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="street_address" className="text-sm font-medium text-slate-600">
                      Street Address
                    </Label>
                    <Input
                      id="street_address"
                      data-testid="street-address-input"
                      value={formData.street_address}
                      onChange={(e) => updateFormData("street_address", e.target.value)}
                      placeholder="123 Main Street"
                      className={`h-14 bg-white border-emerald-900/10 focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900 rounded-lg text-base ${
                        errors.street_address ? "border-red-500" : ""
                      }`}
                    />
                    {errors.street_address && (
                      <p className="text-sm text-red-500">{errors.street_address}</p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium text-slate-600">
                        City
                      </Label>
                      <Input
                        id="city"
                        data-testid="city-input"
                        value={formData.city}
                        onChange={(e) => updateFormData("city", e.target.value)}
                        placeholder="New York"
                        className={`h-14 bg-white border-emerald-900/10 focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900 rounded-lg text-base ${
                          errors.city ? "border-red-500" : ""
                        }`}
                      />
                      {errors.city && (
                        <p className="text-sm text-red-500">{errors.city}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-600">State</Label>
                      <Select
                        value={formData.state}
                        onValueChange={(value) => updateFormData("state", value)}
                      >
                        <SelectTrigger
                          data-testid="state-select"
                          className={`h-14 bg-white border-emerald-900/10 focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900 rounded-lg text-base ${
                            errors.state ? "border-red-500" : ""
                          }`}
                        >
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map((state) => (
                            <SelectItem key={state.value} value={state.value}>
                              {state.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.state && (
                        <p className="text-sm text-red-500">{errors.state}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="zip_code" className="text-sm font-medium text-slate-600">
                      ZIP Code
                    </Label>
                    <Input
                      id="zip_code"
                      data-testid="zip-code-input"
                      value={formData.zip_code}
                      onChange={(e) => updateFormData("zip_code", e.target.value)}
                      placeholder="10001"
                      maxLength={10}
                      className={`h-14 bg-white border-emerald-900/10 focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900 rounded-lg text-base ${
                        errors.zip_code ? "border-red-500" : ""
                      }`}
                    />
                    {errors.zip_code && (
                      <p className="text-sm text-red-500">{errors.zip_code}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Financial Info */}
              {currentStep === 3 && (
                <div className="space-y-6" data-testid="step-3-form">
                  <div>
                    <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 font-['Manrope']">
                      Financial Information
                    </h2>
                    <p className="mt-2 text-slate-500">Help us understand your needs</p>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="annual_income" className="text-sm font-medium text-slate-600">
                        Annual Income ($)
                      </Label>
                      <Input
                        id="annual_income"
                        type="number"
                        data-testid="annual-income-input"
                        value={formData.annual_income}
                        onChange={(e) => updateFormData("annual_income", e.target.value)}
                        placeholder="75000"
                        min="0"
                        className={`h-14 bg-white border-emerald-900/10 focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900 rounded-lg text-base ${
                          errors.annual_income ? "border-red-500" : ""
                        }`}
                      />
                      {errors.annual_income && (
                        <p className="text-sm text-red-500">{errors.annual_income}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-slate-600">Employment Status</Label>
                      <Select
                        value={formData.employment_status}
                        onValueChange={(value) => updateFormData("employment_status", value)}
                      >
                        <SelectTrigger
                          data-testid="employment-status-select"
                          className={`h-14 bg-white border-emerald-900/10 focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900 rounded-lg text-base ${
                            errors.employment_status ? "border-red-500" : ""
                          }`}
                        >
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {EMPLOYMENT_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.employment_status && (
                        <p className="text-sm text-red-500">{errors.employment_status}</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="loan_amount_requested" className="text-sm font-medium text-slate-600">
                      Loan Amount Requested ($)
                    </Label>
                    <Input
                      id="loan_amount_requested"
                      type="number"
                      data-testid="loan-amount-input"
                      value={formData.loan_amount_requested}
                      onChange={(e) => updateFormData("loan_amount_requested", e.target.value)}
                      placeholder="25000"
                      min="0"
                      className={`h-14 bg-white border-emerald-900/10 focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900 rounded-lg text-base ${
                        errors.loan_amount_requested ? "border-red-500" : ""
                      }`}
                    />
                    {errors.loan_amount_requested && (
                      <p className="text-sm text-red-500">{errors.loan_amount_requested}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ssn_last_four" className="text-sm font-medium text-slate-600">
                      SSN (Last 4 Digits)
                    </Label>
                    <Input
                      id="ssn_last_four"
                      type="password"
                      data-testid="ssn-input"
                      value={formData.ssn_last_four}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                        updateFormData("ssn_last_four", value);
                      }}
                      placeholder="••••"
                      maxLength={4}
                      className={`h-14 bg-white border-emerald-900/10 focus:border-emerald-900 focus:ring-1 focus:ring-emerald-900 rounded-lg text-base ${
                        errors.ssn_last_four ? "border-red-500" : ""
                      }`}
                    />
                    {errors.ssn_last_four && (
                      <p className="text-sm text-red-500">{errors.ssn_last_four}</p>
                    )}
                    <p className="text-xs text-slate-400">Your information is encrypted and secure</p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-10 flex gap-4">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    data-testid="back-btn"
                    onClick={handleBack}
                    className="flex-1 h-14 bg-white border-emerald-900/10 text-emerald-900 hover:bg-emerald-50 rounded-full text-lg font-medium transition-all"
                  >
                    Back
                  </Button>
                )}
                
                {currentStep < 3 ? (
                  <Button
                    type="button"
                    data-testid="continue-btn"
                    onClick={handleNext}
                    className="flex-1 h-14 bg-emerald-900 hover:bg-emerald-800 text-white rounded-full text-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    Continue
                  </Button>
                ) : (
                  <Button
                    type="button"
                    data-testid="submit-btn"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 h-14 bg-emerald-900 hover:bg-emerald-800 text-white rounded-full text-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ApplicationForm;
