import React, { useState } from "react";
import { 
  Heart, 
  Share2, 
  Camera, 
  FileText, 
  Users, 
  DollarSign,
  ExternalLink,
  ChevronRight,
  Plus
} from "lucide-react";

export default function SidebarWidget({ caseData = {}, customizations = {}, displayName, isEditing = false }) {
  const [donationAmount, setDonationAmount] = useState("");
  
  // Calculate fundraiser data from case data
  const getFundraiserData = () => {
    const defaultGoal = 25000;
    const goal = customizations?.fundraiser?.goal || parseFloat(caseData.reward_amount) || defaultGoal;
    
    // Mock calculation - in production, this would come from actual donation tracking
    const percentRaised = 0.63; // 63% raised
    const raised = Math.floor(goal * percentRaised);
    const donorCount = Math.floor(raised / 177); // Average donation ~$177
    
    return {
      raised,
      goal,
      donorCount,
      recentDonors: [
        { name: "Anonymous", amount: 100, time: "2 hours ago" },
        { name: "Maria S.", amount: 50, time: "5 hours ago" },
        { name: "John D.", amount: 25, time: "1 day ago" },
      ]
    };
  };

  // Get media items from case photos
  const getMediaItems = () => {
    if (caseData.photos && caseData.photos.length > 0) {
      return caseData.photos.slice(0, 4).map((photo, index) => ({
        type: "image",
        url: photo.image_url || photo.image,
        title: photo.caption || `Photo ${index + 1}`
      }));
    }
    
    // Fallback to placeholder images
    return [
      { type: "image", url: "https://images.unsplash.com/photo-1494790108755-2616c9703b73?w=150&h=150&fit=crop", title: "Family photo" },
      { type: "image", url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop", title: "Recent photo" },
      { type: "image", url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&h=150&fit=crop", title: "Memorial service" },
      { type: "image", url: "https://images.unsplash.com/photo-1488161628813-04466f872be2?w=150&h=150&fit=crop", title: "Missing person flyer" }
    ];
  };

  // Get petition count
  const getPetitionCount = () => {
    // Could be calculated from actual signatures or mock data
    const baseSignatures = 500;
    const daysOld = caseData.created_at ? 
      Math.floor((new Date() - new Date(caseData.created_at)) / (1000 * 60 * 60 * 24)) : 
      30;
    return baseSignatures + (daysOld * 25);
  };

  const fundraiserData = getFundraiserData();
  const mediaItems = getMediaItems();
  const progressPercentage = (fundraiserData.raised / fundraiserData.goal) * 100;
  const showRewardSection = caseData.reward_amount || customizations?.sidebar?.showDonation !== false;
  const totalPhotos = caseData.photos_count || caseData.photos?.length || 16;

  return (
    <div className="w-full lg:w-80 space-y-6">
      {/* Donation/Reward Widget */}
      {showRewardSection && (
        <div className="bg-white rounded-xl shadow-lg border border-yellow-200">
          <div className="px-6 py-4 border-b border-yellow-100">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <Heart className="w-5 h-5 text-red-500" />
              Support the Family
            </h3>
          </div>
          <div className="p-6 space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-slate-800">
                ${fundraiserData.raised.toLocaleString()}
              </div>
              <div className="text-sm text-slate-600">
                raised of ${fundraiserData.goal.toLocaleString()} goal
              </div>
            </div>
            
            <div className="relative h-3 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-yellow-400 to-yellow-500 transition-all duration-500"
                style={{ width: `${Math.min(progressPercentage, 100)}%` }}
              />
            </div>
            
            <div className="flex justify-between text-sm text-slate-600">
              <span>{fundraiserData.donorCount} donors</span>
              <span>{Math.round(progressPercentage)}% complete</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {["$25", "$50", "$100"].map((amount) => (
                <button
                  key={amount}
                  onClick={() => setDonationAmount(amount.slice(1))}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-yellow-50 hover:border-yellow-300 transition-colors"
                >
                  {amount}
                </button>
              ))}
            </div>

            <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-slate-800 font-medium rounded-lg hover:shadow-lg transition-all duration-200">
              <DollarSign className="w-4 h-4" />
              Donate Now
            </button>

            {/* Recent Donors */}
            <div className="space-y-2 pt-3 border-t border-slate-100">
              <h4 className="font-medium text-sm text-slate-700">Recent Supporters</h4>
              {fundraiserData.recentDonors.map((donor, index) => (
                <div key={index} className="flex justify-between items-center text-xs">
                  <span className="text-slate-600">{donor.name}</span>
                  <div className="flex items-center gap-2 text-slate-500">
                    <span>${donor.amount}</span>
                    <span>•</span>
                    <span>{donor.time}</span>
                  </div>
                </div>
              ))}
              <button className="w-full flex items-center justify-center gap-1 text-xs text-slate-600 hover:bg-slate-50 py-2 rounded transition-colors">
                View all donors
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Widget */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Share2 className="w-5 h-5 text-blue-500" />
            Spread the Word
          </h3>
        </div>
        <div className="p-6 space-y-3">
          <p className="text-sm text-slate-600">
            Help us reach more people who might have information about {caseData.first_name || 'this'} case.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-blue-50 transition-colors">
              Facebook
            </button>
            <button className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-blue-50 transition-colors">
              Twitter
            </button>
            <button className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-blue-50 transition-colors">
              Instagram
            </button>
            <button className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-blue-50 transition-colors">
              Copy Link
            </button>
          </div>
        </div>
      </div>

      {/* Media Gallery Preview */}
      <div className="bg-white rounded-xl shadow-lg">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <Camera className="w-5 h-5 text-green-500" />
            Media Gallery
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-2 mb-3">
            {mediaItems.map((item, index) => (
              <div
                key={index}
                className="relative group cursor-pointer rounded-lg overflow-hidden aspect-square"
              >
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200" />
                {index === 3 && totalPhotos > 4 && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white font-medium">+{totalPhotos - 4} more</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          <button className="w-full flex items-center justify-center gap-1 text-sm border border-gray-300 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
            View All Photos
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Petition Widget */}
      <div className="bg-white rounded-xl shadow-lg border border-purple-200">
        <div className="px-6 py-4 border-b border-purple-100">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
            <FileText className="w-5 h-5 text-purple-500" />
            Take Action
          </h3>
        </div>
        <div className="p-6 space-y-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-slate-600">
              {getPetitionCount().toLocaleString()} people have signed
            </span>
          </div>
          <p className="text-sm text-slate-600">
            Sign our petition demanding {caseData.investigating_agency ? 
              `${caseData.investigating_agency} increase` : 
              'increased'} resources for this investigation.
          </p>
          <button className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors">
            <FileText className="w-4 h-4" />
            Sign Petition
          </button>
        </div>
      </div>

      {/* Contact Information (if available) */}
      {(caseData.detective_name || caseData.detective_phone) && (
        <div className="bg-white rounded-xl shadow-lg border border-blue-200">
          <div className="px-6 py-4 border-b border-blue-100">
            <h3 className="text-lg font-semibold text-slate-800">Contact Information</h3>
          </div>
          <div className="p-6 space-y-2 text-sm">
            {caseData.investigating_agency && (
              <p className="text-slate-700">
                <span className="font-medium">Agency:</span> {caseData.investigating_agency}
              </p>
            )}
            {caseData.detective_name && (
              <p className="text-slate-700">
                <span className="font-medium">Detective:</span> {caseData.detective_name}
              </p>
            )}
            {caseData.detective_phone && (
              <p className="text-slate-700">
                <span className="font-medium">Phone:</span> {caseData.detective_phone}
              </p>
            )}
            {caseData.detective_email && (
              <p className="text-slate-700">
                <span className="font-medium">Email:</span> {caseData.detective_email}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}