import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Zap, Clock, ArrowRight, Banknote, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Quick Application",
      description: "Complete your application in under 5 minutes"
    },
    {
      icon: <ShieldCheck className="w-6 h-6" />,
      title: "Secure & Private",
      description: "Your information is encrypted and protected"
    },
    {
      icon: <Clock className="w-6 h-6" />,
      title: "Fast Decision",
      description: "Get a response within 24 hours"
    }
  ];

  const benefits = [
    "No hidden fees or charges",
    "Competitive interest rates",
    "Flexible repayment options",
    "Expert customer support"
  ];

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      {/* Navigation */}
      <nav className="px-6 md:px-12 lg:px-24 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Banknote className="w-8 h-8 text-emerald-900" />
            <span className="text-xl font-bold text-emerald-900 font-['Manrope']">LoanEase</span>
          </div>
          <Button
            data-testid="nav-apply-btn"
            onClick={() => navigate("/apply")}
            className="bg-emerald-900 hover:bg-emerald-800 text-white rounded-full px-6 py-2 font-medium transition-all hover:scale-105"
          >
            Apply Now
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 md:px-12 lg:px-24 py-12 md:py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-8"
          >
            <div className="space-y-4">
              <span className="text-sm font-medium text-emerald-700 uppercase tracking-wider">
                Simple & Fast Loans
              </span>
              <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] text-slate-900 font-['Manrope']">
                Get the funds you need, <span className="text-emerald-900">today</span>
              </h1>
              <p className="text-lg md:text-xl leading-relaxed text-slate-600 max-w-xl">
                Apply for a personal loan in minutes. Simple process, fast decisions, and competitive rates tailored to your needs.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                data-testid="hero-apply-btn"
                onClick={() => navigate("/apply")}
                className="bg-emerald-900 hover:bg-emerald-800 text-white rounded-full px-8 py-6 text-lg font-medium transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
              >
                Start Application
                <ArrowRight className="w-5 h-5" />
              </Button>
              <Button
                data-testid="hero-learn-more-btn"
                variant="outline"
                className="bg-white border-emerald-900/10 text-emerald-900 hover:bg-emerald-50 rounded-full px-8 py-6 text-lg font-medium transition-all"
              >
                Learn More
              </Button>
            </div>

            {/* Benefits List */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-slate-600">
                  <CheckCircle2 className="w-5 h-5 text-lime-500 flex-shrink-0" />
                  <span className="text-sm">{benefit}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden lg:block"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1648737966670-a6a53917ed19?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2NDJ8MHwxfHNlYXJjaHwyfHxoYXBweSUyMGNvdXBsZSUyMGxhcHRvcCUyMGZpbmFuY2V8ZW58MHx8fHwxNzY3NjQ0MDIwfDA&ixlib=rb-4.1.0&q=85"
                alt="Happy couple reviewing finances"
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/20 to-transparent" />
            </div>
            
            {/* Floating Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-6 shadow-xl border border-emerald-900/5"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-lime-400 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-emerald-900" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-900 font-['Manrope']">$50K+</p>
                  <p className="text-sm text-slate-500">Average loan amount</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-6 md:px-12 lg:px-24 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-slate-900 font-['Manrope']">
            Why choose us?
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            We've simplified the loan process so you can focus on what matters most.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              data-testid={`feature-card-${index}`}
              className="bg-white rounded-2xl border border-emerald-900/5 p-8 shadow-sm hover:shadow-md transition-all duration-300 group"
            >
              <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-900 mb-6 group-hover:bg-lime-400 group-hover:text-emerald-900 transition-all duration-300">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-slate-900 font-['Manrope'] mb-3">
                {feature.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 md:px-12 lg:px-24 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-emerald-900 rounded-3xl p-12 md:p-16 text-center"
        >
          <h2 className="text-3xl md:text-4xl font-semibold text-white font-['Manrope'] mb-4">
            Ready to get started?
          </h2>
          <p className="text-emerald-100 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of satisfied customers who've achieved their financial goals with us.
          </p>
          <Button
            data-testid="cta-apply-btn"
            onClick={() => navigate("/apply")}
            className="bg-lime-400 hover:bg-lime-300 text-emerald-900 rounded-full px-10 py-6 text-lg font-semibold transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Apply Now — It's Free
          </Button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-6 md:px-12 lg:px-24 py-8 border-t border-emerald-900/5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Banknote className="w-6 h-6 text-emerald-900" />
            <span className="text-lg font-bold text-emerald-900 font-['Manrope']">LoanEase</span>
          </div>
          <p className="text-sm text-slate-500">
            © 2025 LoanEase. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
