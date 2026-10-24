"use client"

import Image from "next/image"
import Link from "next/link"
import { Sparkles, ArrowLeft } from "lucide-react"

export default function PremiumFeaturePage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-pink-50">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-amber-900" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-[#242220] mb-4">
          Premium Feature
        </h1>

        {/* Description */}
        <p className="text-lg text-gray-600 mb-8">
          This feature is available in our Premium plan. Upgrade to unlock Analytics and Announcements along with other advanced features.
        </p>

        {/* Features List */}
        <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
          <h2 className="text-xl font-semibold text-[#242220] mb-4">Premium Features Include:</h2>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#DF6647]"></div>
              <span>Advanced Analytics & Insights</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#DF6647]"></div>
              <span>Announcements & Communication Tools</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#DF6647]"></div>
              <span>Priority Support</span>
            </li>
            <li className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#DF6647]"></div>
              <span>And much more...</span>
            </li>
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="px-6 py-3 bg-[#DF6647] text-white font-semibold rounded-lg hover:bg-[#DF6647]/90 transition-colors">
            Upgrade to Premium
          </button>
          <Link
            href="/home"
            className="px-6 py-3 border-2 border-[#DF6647] text-[#DF6647] font-semibold rounded-lg hover:bg-[#DF6647]/5 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
