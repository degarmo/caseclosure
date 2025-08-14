
import React from "react";
import { Check, Star, Crown, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Free Tier",
    price: "$0",
    period: "forever",
    icon: Heart,
    color: "border-slate-200",
    buttonStyle: "bg-slate-100 text-slate-800 hover:bg-slate-200",
    description: "Basic case page to get started",
    features: [
      "Your own subdomain (4josh.CaseClosure.org)",
      "Basic case page creation",
      "Photo upload (up to 10 images)",
      "Anonymous tip submission",
      "Basic visitor analytics",
      "30-day tip history",
      "Community support forum access"
    ],
    limitations: [
      "Limited customization options",
      "CaseClosure branding displayed",
      "Basic support only"
    ]
  },
  {
    name: "Supporter Tier", 
    price: "$19",
    period: "per month",
    icon: Star,
    color: "border-orange-300 ring-2 ring-orange-100",
    buttonStyle: "accent-gradient text-slate-800 hover:shadow-lg",
    popular: true,
    description: "Full-featured platform for active cases",
    features: [
      "Bring your own custom domain (4josh.org)",
      "Unlimited photo & video uploads",
      "Advanced visitor tracking & analytics", 
      "Tip categorization & tagging",
      "Priority AI analysis of tips",
      "Social media sharing tools",
      "Email notifications for new tips",
      "Complete tip history & export",
      "Remove CaseClosure branding",
      "Priority email support"
    ]
  },
  {
    name: "Legacy Tier",
    price: "$99", 
    period: "one-time",
    icon: Crown,
    color: "border-purple-300",
    buttonStyle: "bg-purple-600 text-white hover:bg-purple-700",
    description: "Memorial and ongoing case management",
    features: [
      "Everything in Supporter Tier",
      "Memorial page creation",
      "Annual remembrance features",
      "Advanced case timeline builder",
      "Private investigator referrals",
      "Law enforcement collaboration tools",
      "White-label case page option",
      "Lifetime access to all features",
      "Case archival guarantee",
      "Dedicated case advocate support"
    ]
  }
];

export default function Pricing() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl lg:text-5xl font-bold gradient-text mb-6">
          Choose Your Plan
        </h1>
        <p className="text-xl text-slate-600 max-w-3xl mx-auto">
          Every plan is designed to help families find answers. Choose the level of support 
          that's right for your situation and budget.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8 mb-16">
        {plans.map((plan, index) => (
          <div key={index} className={`floating-card relative ${plan.popular ? 'lg:-mt-4' : ''}`}>
            {plan.popular && (
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 z-10">
                <Badge className="accent-gradient text-slate-800 font-semibold px-4 py-1">
                  Most Popular
                </Badge>
              </div>
            )}
            
            <div className={`bg-white/90 backdrop-blur-sm rounded-3xl p-8 shadow-xl border-2 ${plan.color} h-full`}>
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <plan.icon className="w-8 h-8 text-slate-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">{plan.name}</h3>
                <p className="text-slate-600 mb-4">{plan.description}</p>
                <div className="mb-6">
                  <span className="text-4xl font-bold gradient-text">{plan.price}</span>
                  <span className="text-slate-500 ml-2">/{plan.period}</span>
                </div>
                <Button className={`w-full ${plan.buttonStyle} rounded-full py-3`}>
                  {plan.name === "Free Tier" ? "Get Started Free" : 
                   plan.name === "Legacy Tier" ? "Choose Legacy" : "Start 14-Day Trial"}
                </Button>
              </div>
              
              <div className="space-y-4">
                <h4 className="font-semibold text-slate-800">What's Included:</h4>
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-slate-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                {plan.limitations && (
                  <div className="pt-4 border-t border-slate-100">
                    <h5 className="text-sm font-medium text-slate-500 mb-2">Limitations:</h5>
                    <ul className="space-y-1">
                      {plan.limitations.map((limitation, idx) => (
                        <li key={idx} className="text-sm text-slate-400">• {limitation}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="floating-card bg-gradient-to-r from-slate-50 to-orange-50/30 rounded-3xl p-8 lg:p-12 shadow-lg border border-white/20">
        <div className="text-center">
          <h2 className="text-2xl font-bold gradient-text mb-4">
            Questions About Pricing?
          </h2>
          <p className="text-slate-600 mb-8 max-w-2xl mx-auto">
            We understand every family's situation is unique. If cost is a concern, 
            we offer financial assistance and payment plans. Your family deserves support regardless of budget.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" className="rounded-full px-8">
              Contact for Assistance
            </Button>
            <Button variant="outline" className="rounded-full px-8">
              View Payment Plans
            </Button>
          </div>
        </div>
      </div>

      <div className="mt-16 grid md:grid-cols-3 gap-8 text-center">
        <div>
          <div className="text-3xl mb-4">🔒</div>
          <h3 className="font-bold text-slate-800 mb-2">Secure & Private</h3>
          <p className="text-slate-600">Your data is encrypted and secure. Cancel anytime with full data export.</p>
        </div>
        <div>
          <div className="text-3xl mb-4">💝</div>
          <h3 className="font-bold text-slate-800 mb-2">Made with Love</h3>
          <p className="text-slate-600">Built by a team who understands the importance of every family's search.</p>
        </div>
        <div>
          <div className="text-3xl mb-4">🤝</div>
          <h3 className="font-bold text-slate-800 mb-2">Community Support</h3>
          <p className="text-slate-600">Join thousands of families supporting each other through difficult times.</p>
        </div>
      </div>
    </div>
  );
}
